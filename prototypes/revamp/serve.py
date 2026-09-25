#!/usr/bin/env python3
"""serve.py -- the revamp's dev server: static files plus the art gallery's API.

`python3 -m http.server` cannot take a POST, and the gallery needs one. This serves the
folder exactly as before and adds the one route the gallery talks to, with the SAME
contract as the live site's Next route (src/app/api/gallery/cards/route.ts), so the page
code here is what ships: swap the JSON file for the Redis list and nothing else moves.

  GET  /api/gallery/cards          -> {cards:[...]}   newest first, at most MAX_CARDS
  POST /api/gallery/cards {name,color,drawing} -> {card}   prepend, trim to MAX_CARDS

Run:  python3 serve.py 5330
"""
import json, os, sys, uuid, time, random, threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
STORE = os.path.join(ROOT, "gallery-cards.json")
MAX_CARDS = 12
COLORS = {"gold", "oxblood", "charcoal", "paper"}
LOCK = threading.Lock()

def load():
    try:
        with open(STORE) as f: return json.load(f)
    except Exception: return []

def save(cards):
    tmp = STORE + ".tmp"
    with open(tmp, "w") as f: json.dump(cards, f)
    os.replace(tmp, STORE)

class H(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=ROOT, **k)

    def _json(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers(); self.wfile.write(body)

    def end_headers(self):
        # a dev server must never let the browser keep yesterday's script
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    def do_GET(self):
        if self.path.split("?")[0] == "/api/gallery/cards":
            with LOCK: cards = load()[:MAX_CARDS]
            return self._json(200, {"cards": cards})
        return super().do_GET()

    def do_POST(self):
        if self.path.split("?")[0] != "/api/gallery/cards":
            return self._json(404, {"error": "Not found"})
        try:
            n = int(self.headers.get("Content-Length") or 0)
            body = json.loads(self.rfile.read(n) or b"{}")
        except Exception:
            return self._json(400, {"error": "Bad JSON"})
        name, color, drawing = body.get("name"), body.get("color"), body.get("drawing")
        if not isinstance(color, str) or color not in COLORS:
            return self._json(400, {"error": "Invalid color"})
        if not isinstance(drawing, str) or not drawing.startswith("data:image/png;base64,"):
            return self._json(400, {"error": "Invalid drawing"})
        if len(drawing) > 700_000:
            return self._json(413, {"error": "Drawing too large"})
        safe = name.strip()[:60] if isinstance(name, str) and name.strip() else f"Mystery Artist #{random.randint(1000, 9999)}"
        card = {"id": str(uuid.uuid4()), "name": safe, "color": color, "drawing": drawing, "createdAt": int(time.time() * 1000)}
        with LOCK:
            cards = load(); cards.insert(0, card); save(cards[:MAX_CARDS])
        return self._json(201, {"card": card})

    def log_message(self, *a): pass

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5330
    ThreadingHTTPServer(("", port), H).serve_forever()
