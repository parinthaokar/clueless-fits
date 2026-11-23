"""Put an outfit on the Blender mannequin through the Blender MCP add-on.

    python dress.py outfits/example.json
    python dress.py outfits/example.json --render out.png
    python dress.py --watch recommendation.json     # re-dress whenever the file changes

Needs Blender running with the blender-mcp add-on connected (default localhost:9876).
Only the standard library is required; Pillow (optional) lets product photos be
projected onto the garments and sets each garment's colour from its photo.
"""
import argparse
import hashlib
import json
import os
import socket
import sys
import time
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, ".cache")

# Names used by the app's mock data -> dataset categories.
APP_CATEGORY = {
    "tops": "tops", "bottoms": "bottoms", "dresses": "all-body",
    "outerwear": "outerwear", "shoes": "shoes", "bags": "bags",
    "accessories": "accessories",
}
TEXTURED = {"tops", "bottoms", "all-body", "outerwear"}


# ---------- Blender MCP socket ----------

def send_to_blender(code, host="localhost", port=9876, timeout=120):
    """Run python in Blender via the blender-mcp add-on's execute_code command."""
    payload = json.dumps({"type": "execute_code", "params": {"code": code}}).encode()
    with socket.create_connection((host, port), timeout=10) as s:
        s.settimeout(timeout)
        s.sendall(payload)
        buf = b""
        while True:
            chunk = s.recv(65536)
            if not chunk:
                raise ConnectionError("Blender closed the connection")
            buf += chunk
            try:
                reply = json.loads(buf)
                break
            except json.JSONDecodeError:
                continue
    if reply.get("status") == "error":
        raise RuntimeError(reply.get("message", "Blender reported an error"))
    return reply.get("result", {})


# ---------- outfit normalisation ----------

def _lookup_supabase(item_id):
    """Fill in a bare dataset item_id from the project's `items` table (public read)."""
    url, key = os.environ.get("SUPABASE_URL"), os.environ.get("SUPABASE_ANON_KEY")
    if not (url and key):
        raise SystemExit(f"item {item_id} has no category; set SUPABASE_URL and "
                         "SUPABASE_ANON_KEY to look it up, or put the category in the outfit file")
    q = f"{url}/rest/v1/items?item_id=eq.{urllib.parse.quote(item_id)}&select=*"
    req = urllib.request.Request(q, headers={"apikey": key, "Authorization": f"Bearer {key}"})
    with urllib.request.urlopen(req, timeout=20) as r:
        rows = json.load(r)
    if not rows:
        raise SystemExit(f"item {item_id} not found in Supabase")
    return rows[0]


def _refine(category, name):
    """Split the dataset's/app's broad 'accessories' using the item name."""
    n = name.lower()
    if category == "accessories":
        for words, cat in ((("sunglass", "shades"), "sunglasses"),
                           (("hat", "cap", "beanie", "beret"), "hats"),
                           (("scarf", "shawl"), "scarves"),
                           (("necklace", "pendant", "choker"), "jewellery")):
            if any(w in n for w in words):
                return cat
    return category


def normalize(outfit):
    """Accept the app's OutfitSuggestion ({items:[{slot,item:{...}}]}) or flat dataset rows."""
    items = []
    for entry in outfit["items"]:
        raw = dict(entry.get("item", entry))
        if "category" not in raw and "item_id" in raw:
            raw = {**_lookup_supabase(str(raw["item_id"])), **raw}
        name = raw.get("name") or raw.get("title") or raw.get("url_name") or ""
        cat = APP_CATEGORY.get(raw["category"].lower(), raw["category"].lower())
        items.append({
            "category": _refine(cat, name),
            "name": name,
            "color": raw.get("color"),
            "image": raw.get("image") or raw.get("image_url") or raw.get("imageUrl"),
        })
    return items


# ---------- product photo prep ----------

def _fetch_image(ref):
    """Return a local path for a URL or file path; None for anything Blender can't load."""
    if not ref or ref.lower().endswith(".svg"):
        return None
    if ref.startswith(("http://", "https://")):
        os.makedirs(CACHE, exist_ok=True)
        ext = os.path.splitext(urllib.parse.urlparse(ref).path)[1] or ".jpg"
        path = os.path.join(CACHE, hashlib.sha1(ref.encode()).hexdigest() + ext)
        if not os.path.exists(path):
            urllib.request.urlretrieve(ref, path)
        return path
    return os.path.abspath(ref) if os.path.exists(ref) else None


def prepare_image(ref, textured):
    """Crop the white studio background and fill it with the garment's mean colour."""
    path = _fetch_image(ref)
    if not path:
        return None, None
    try:
        from PIL import Image
    except ImportError:
        return (path if textured else None), None
    img = Image.open(path).convert("RGB")
    px = img.load()
    w, h = img.size
    fg = [(x, y) for y in range(h) for x in range(w) if min(px[x, y]) < 235]
    if not fg:
        return None, None
    color = tuple(sum(px[p][c] for p in fg) // len(fg) for c in range(3))
    hexc = "#%02x%02x%02x" % color
    if not textured:
        return None, hexc
    xs, ys = [p[0] for p in fg], [p[1] for p in fg]
    img = img.crop((min(xs), min(ys), max(xs) + 1, max(ys) + 1))
    px = img.load()
    for y in range(img.size[1]):
        for x in range(img.size[0]):
            if min(px[x, y]) >= 235:
                px[x, y] = color
    out = os.path.join(CACHE, "prep_" + hashlib.sha1(path.encode()).hexdigest() + ".png")
    os.makedirs(CACHE, exist_ok=True)
    img.save(out)
    return out, hexc


def prepare(outfit):
    items = normalize(outfit)
    for it in items:
        image, color = prepare_image(it["image"], it["category"] in TEXTURED)
        it["image"] = image
        it["color"] = it["color"] or color
    return {"items": items, "reset": outfit.get("reset", True)}


# ---------- run ----------

def dress(outfit, host="localhost", port=9876, render=None):
    payload = prepare(outfit)
    if render:
        payload["render"] = os.path.abspath(render)
    with open(os.path.join(HERE, "scene_builder.py")) as f:
        code = f.read() + f"\ndress({payload!r})\n"
    return send_to_blender(code, host, port)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawTextHelpFormatter)
    ap.add_argument("outfit", nargs="?", help="outfit JSON file")
    ap.add_argument("--watch", metavar="FILE", help="re-dress whenever FILE changes")
    ap.add_argument("--render", metavar="PNG", help="also render the result to this file")
    ap.add_argument("--host", default="localhost")
    ap.add_argument("--port", type=int, default=9876)
    a = ap.parse_args()
    if not (a.outfit or a.watch):
        ap.error("give an outfit file or --watch FILE")

    def run(path):
        with open(path) as f:
            result = dress(json.load(f), a.host, a.port, a.render)
        print(result.get("result", result))

    try:
        if a.outfit:
            run(a.outfit)
        else:
            last = None
            print(f"watching {a.watch} (Ctrl-C to stop)")
            while True:
                if os.path.exists(a.watch):
                    stamp = os.path.getmtime(a.watch)
                    if stamp != last:
                        last = stamp
                        try:
                            run(a.watch)
                        except (ValueError, OSError, RuntimeError) as e:
                            print("skipped:", e)
                time.sleep(1)
    except (ConnectionRefusedError, socket.timeout) as e:
        sys.exit(f"Can't reach Blender on {a.host}:{a.port} ({e}). Open Blender, press N, "
                 "BlenderMCP tab -> Connect.")
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
