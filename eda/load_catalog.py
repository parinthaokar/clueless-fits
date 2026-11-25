"""Load the WHOLE modelled catalog (one Polyvore shard, 41,835 items) into Supabase.

The recommendation model (recommender/) only knows these items, and its results are item ids, so
every id needs a row in `items` and a photo in the public `item-images` bucket as <item_id>.jpg.
(load_supabase.py loads only a 5,000-item sample for the D2 dashboard.)

Run once, from the repo root (re-running is safe: rows and files are upserted):
    pip install httpx pyarrow python-dotenv
    python eda/load_catalog.py ~/Documents/clothing-rec-model/data/shard0.parquet

Needs SUPABASE_URL and SUPABASE_SERVICE_KEY (the secret key) in the environment or a .env file.
Never commit the key. Run eda/schema.sql in the Supabase SQL Editor first.
"""

import json
import os
import sys
from concurrent.futures import ThreadPoolExecutor

import httpx
import pyarrow.parquet as pq
from dotenv import load_dotenv

load_dotenv()
load_dotenv(os.path.expanduser("~/Documents/clueless-fits/.env.local"))
URL = os.environ["SUPABASE_URL"].rstrip("/")
KEY = os.environ["SUPABASE_SERVICE_KEY"]
BUCKET = "item-images"
H = {"apikey": KEY, "Authorization": f"Bearer {KEY}"}
PUBLIC = f"{URL}/storage/v1/object/public/{BUCKET}"


def row(r):
    title, desc, name = r["title"] or "", r["description"] or "", r["url_name"] or ""
    return {
        "item_id": str(r["item_id"]), "url_name": name, "title": title, "description": desc,
        "category": r["category"], "has_title": bool(title), "has_description": bool(desc),
        "desc_len": len(desc), "non_ascii": not (name + title + desc).isascii(),
        "image_url": f"{PUBLIC}/{r['item_id']}.jpg",
    }


def upload(client, item_id, raw):
    for attempt in range(4):
        try:
            res = client.post(f"{URL}/storage/v1/object/{BUCKET}/{item_id}.jpg", content=raw,
                              headers={**H, "Content-Type": "image/jpeg", "x-upsert": "true"})
            if res.status_code < 300:
                return True
        except httpx.HTTPError:
            pass
    return False


def main(path):
    pf = pq.ParquetFile(path)
    total, done, failed = pf.metadata.num_rows, 0, []
    with httpx.Client(timeout=60, limits=httpx.Limits(max_connections=32)) as client, ThreadPoolExecutor(24) as pool:
        for batch in pf.iter_batches(batch_size=500):
            rows = batch.to_pylist()
            ids = [str(r["item_id"]) for r in rows]
            raws = [(r["image"]["bytes"] if isinstance(r["image"], dict) else r["image"]) for r in rows]
            ok = list(pool.map(lambda a: upload(client, *a), zip(ids, raws)))
            failed += [i for i, k in zip(ids, ok) if not k]
            good = [row(r) for r, k in zip(rows, ok) if k]
            res = client.post(f"{URL}/rest/v1/items", content=json.dumps(good),
                              headers={**H, "Content-Type": "application/json",
                                       "Prefer": "resolution=merge-duplicates,return=minimal"})
            res.raise_for_status()
            done += len(rows)
            print(f"{done:,}/{total:,}  failed so far: {len(failed)}", flush=True)
    print("done. failed ids:", failed[:20], "..." if len(failed) > 20 else "")


if __name__ == "__main__":
    main(sys.argv[1])
