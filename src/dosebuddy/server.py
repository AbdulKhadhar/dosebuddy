"""HTTP layer. Standard library only, localhost only."""
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from . import __version__, config, llm, storage
from .rules import check, normalize, parse

MAX_BODY = 64 * 1024

class Handler(BaseHTTPRequestHandler):
    def _send(self, obj, code=200, ctype="application/json"):
        data = obj if isinstance(obj, bytes) else json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if self.path == "/api/health":
            return self._send({"ok": True, "version": __version__})
        if self.path == "/api/plan":
            return self._send(storage.latest_plan())

        # Serve static assets (app.css, app.js, icons, etc.)
        clean_path = self.path.split("?")[0].lstrip("/")
        if clean_path:
            file_path = (config.STATIC / clean_path).resolve()
            static_dir = config.STATIC.resolve()
            if file_path.is_file() and (file_path == static_dir or static_dir in file_path.parents):
                mime = "text/plain"
                if clean_path.endswith(".css"):
                    mime = "text/css; charset=utf-8"
                elif clean_path.endswith(".js"):
                    mime = "application/javascript; charset=utf-8"
                elif clean_path.endswith(".svg"):
                    mime = "image/svg+xml"
                elif clean_path.endswith(".html"):
                    mime = "text/html; charset=utf-8"
                return self._send(file_path.read_bytes(), ctype=mime)

        self._send((config.STATIC / "index.html").read_bytes(), ctype="text/html; charset=utf-8")

    def do_POST(self):
        try:
            n = int(self.headers.get("Content-Length", 0))
            if n > MAX_BODY:
                return self._send({"error": "too large"}, 413)
            d = json.loads(self.rfile.read(n) or b"{}")
        except ValueError:
            return self._send({"error": "bad request"}, 400)
        if self.path == "/api/extract":
            text = str(d.get("text", ""))[:5000]
            meds, src = llm.extract_meds(text), "local model"
            if not meds:
                meds, src = parse(text), "simple rules (start Ollama for better results)"
            return self._send({"meds": meds, "source": src})
        if self.path == "/api/plan":
            meds = [normalize(m) for m in d.get("meds", []) if str(m.get("name", "")).strip()]
            slots, warnings = check(meds)
            plan = {"name": str(d.get("name", ""))[:40], "lang": d.get("lang", "en"),
                    "meds": meds, "slots": slots, "warnings": warnings}
            storage.save_plan(plan)
            return self._send(plan)
        self._send({"error": "not found"}, 404)

    def log_message(self, *args):
        pass

def make_server(host="127.0.0.1", port=8000):
    return ThreadingHTTPServer((host, port), Handler)
