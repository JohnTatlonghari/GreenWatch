#!/usr/bin/env python3
import json, sys, time, random
from cortex import CortexClient, DistanceMetric

ADDRESS = "localhost:50051"

COLLECTIONS = {
    "sessions": 1,
    "messages": 1,
    "events":   1,
    "errors":   1,
}

def ensure_collections(client: CortexClient):
    for name, dim in COLLECTIONS.items():
        if not client.has_collection(name):
            client.create_collection(
                name=name,
                dimension=dim,
                distance_metric=DistanceMetric.COSINE,
            )

def make_id(ts_ms: int) -> int:
    return (ts_ms << 12) | random.randint(0, 4095)

def main():
    raw = sys.stdin.read()
    req = json.loads(raw)
    collection = req["collection"]
    payload = req["payload"]

    ts_ms = int(time.time() * 1000)
    rid = make_id(ts_ms)

    with CortexClient(ADDRESS) as client:
        ensure_collections(client)
        client.upsert(collection, id=rid, vector=[0.0], payload=payload)

    sys.stdout.write(json.dumps({"ok": True, "id": rid, "ts_ms": ts_ms}))

if __name__ == "__main__":
    main()
