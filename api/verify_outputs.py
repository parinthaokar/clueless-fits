"""
D4 check: the local API and the deployed Modal API give the same outputs.

Sends the same requests to both and compares the full responses: /pipeline-info (model name,
version, scikit-learn version, classes) and /predict (category, confidence, top 3) for every
input below. Exits with 1 if anything differs, so it can't pass quietly.

Run from inside api/, with the local server running in another terminal:
    uv run uvicorn main:app                      # terminal 1 (add MODEL_MODE=pipeline for D4)
    uv run python verify_outputs.py              # terminal 2
    uv run python verify_outputs.py --report verify_report.json   # also save the results
"""

import argparse
import json
import sys
import urllib.error
import urllib.request

LOCAL_URL = "http://127.0.0.1:8000"
DEPLOYED_URL = "https://rgollapa105--clueless-closet-api-fastapi-app.us-east.modal.run"

# Useful inputs: one or more per category, a description, mixed case, and a vague name.
INPUTS = [
    {"name": "Black leather ankle boots"},
    {"name": "White canvas sneakers"},
    {"name": "Red midi dress", "description": "Silk, ankle length"},
    {"name": "Light-wash straight leg jeans"},
    {"name": "Pleated mini skirt"},
    {"name": "Striped button-up shirt"},
    {"name": "Camel wool trench coat"},
    {"name": "Mini leather shoulder bag"},
    {"name": "Gold hoop earrings"},
    {"name": "Cat-eye sunglasses"},
    {"name": "Straw sun hat"},
    {"name": "Plaid silk scarf"},
    {"name": "Brown leather belt"},
    {"name": "MARC JACOBS fold down army"},
    {"name": "something cute for a party"},
]

# The API rounds probabilities to 4 decimals; allow a difference in the last place.
TOLERANCE = 1e-4
INFO_FIELDS = ["model_name", "model_version", "sklearn_version", "classes", "is_stub"]


def call(base, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(base + path, data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=120) as res:
            return json.load(res)
    except urllib.error.HTTPError as e:
        return {"error": e.code, "detail": e.read().decode()}
    except urllib.error.URLError as e:
        sys.exit(f"Can't reach {base}: {e.reason}. Is the server running?")


def same_prediction(a, b):
    if "error" in a or "error" in b:
        return a == b
    if (a["category"], a["app_category"], a["slots"]) != (b["category"], b["app_category"], b["slots"]):
        return False
    if abs(a["confidence"] - b["confidence"]) > TOLERANCE:
        return False
    return [t["category"] for t in a["top_3"]] == [t["category"] for t in b["top_3"]] and all(
        abs(x["probability"] - y["probability"]) <= TOLERANCE for x, y in zip(a["top_3"], b["top_3"])
    )


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--local", default=LOCAL_URL)
    parser.add_argument("--deployed", default=DEPLOYED_URL)
    parser.add_argument("--report", help="also save every response to this JSON file")
    args = parser.parse_args()

    print(f"Local:    {args.local}\nDeployed: {args.deployed}\n")
    ok = True

    local_info, deployed_info = call(args.local, "/pipeline-info"), call(args.deployed, "/pipeline-info")
    print("Pipeline info")
    for field in INFO_FIELDS:
        a, b = local_info.get(field), deployed_info.get(field)
        match = a == b
        ok &= match
        shown = f"{len(a)} classes" if field == "classes" and isinstance(a, list) else a
        print(f"  {'OK  ' if match else 'DIFF'} {field:<16} {shown}" + ("" if match else f"  vs deployed: {b}"))

    print(f"\n{'':4} {'Input':<36} {'Local':<22} {'Deployed':<22}")
    results = []
    for body in INPUTS:
        a, b = call(args.local, "/predict", body), call(args.deployed, "/predict", body)
        match = same_prediction(a, b)
        ok &= match
        label = body["name"] + (" (+ description)" if "description" in body else "")
        fmt = lambda r: f"error {r['error']}" if "error" in r else f"{r['category']} {r['confidence']:.4f}"
        print(f"{'OK  ' if match else 'DIFF'} {label[:36]:<36} {fmt(a):<22} {fmt(b):<22}")
        results.append({"input": body, "local": a, "deployed": b, "match": match})

    matched = sum(r["match"] for r in results)
    print(f"\n{matched}/{len(results)} predictions match. Pipeline info {'matches' if all(local_info.get(f) == deployed_info.get(f) for f in INFO_FIELDS) else 'DIFFERS'}.")
    print("RESULT:", "local and deployed outputs MATCH" if ok else "local and deployed outputs DIFFER")

    if args.report:
        with open(args.report, "w") as f:
            json.dump({"local": args.local, "deployed": args.deployed, "pipeline_info": {"local": local_info, "deployed": deployed_info}, "predictions": results, "match": ok}, f, indent=2)
        print(f"Saved {args.report}")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
