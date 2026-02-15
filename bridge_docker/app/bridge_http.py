import json, traceback
from http.server import BaseHTTPRequestHandler, HTTPServer

from cortex import CortexClient, DistanceMetric

DB_ADDR = "vectoraidb:50051"

VECTOR_DIM = 3
DUMMY_VECTOR = [0.0, 0.0, 0.0]

COLLECTIONS = {
    "sessions": VECTOR_DIM,
    "messages": VECTOR_DIM,
    "events":   VECTOR_DIM,
    "errors":   VECTOR_DIM,
}

def ensure_collections(client: CortexClient):
    for name, dim in COLLECTIONS.items():
        if not client.has_collection(name):
            client.create_collection(
                name=name,
                dimension=dim,
                distance_metric=DistanceMetric.COSINE,
            )

class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        # quieter default logging
        return

    def _send(self, code: int, obj: dict):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self._send(204, {})

    def do_POST(self):
        if self.path == "/init":
            try:
                with CortexClient(DB_ADDR) as client:
                    ensure_collections(client)
                self._send(200, {"ok": True})
            except Exception as e:
                self._send(500, {"ok": False, "error": str(e), "trace": traceback.format_exc()})
            return

        if self.path != "/upsert":
            self._send(404, {"error": "not found"})
            return

        try:
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length).decode("utf-8")
            req = json.loads(raw)
            collection = req["collection"]
            payload = req["payload"]
        except Exception as e:
            self._send(400, {"ok": False, "error": "bad request", "detail": str(e)})
            return

        if "_id" not in payload:
            payload["_id"] = 0

        try:
            with CortexClient(DB_ADDR) as client:
                # assume /init was called once; do NOT auto-create here
                client.upsert(
                    collection,
                    id=int(payload["_id"]),
                    vector=DUMMY_VECTOR,
                    payload=payload
                )
            self._send(200, {"ok": True})
        except Exception as e:
            self._send(500, {"ok": False, "error": str(e), "trace": traceback.format_exc()})

def main():
    print(f"[bridge] starting HTTP server on 0.0.0.0:50052; DB={DB_ADDR}", flush=True)
    server = HTTPServer(("0.0.0.0", 50052), Handler)
    server.serve_forever()

if __name__ == "__main__":
    main()
