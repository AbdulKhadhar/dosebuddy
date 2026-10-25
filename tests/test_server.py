import json
import threading
import urllib.request

from dosebuddy.server import make_server

def _post(base, path, body):
    req = urllib.request.Request(base + path, json.dumps(body).encode(), {"Content-Type": "application/json"})
    return json.load(urllib.request.urlopen(req))

def test_end_to_end(tmp_path, monkeypatch):
    monkeypatch.setenv("DOSEBUDDY_DATA", str(tmp_path))
    monkeypatch.setenv("DOSEBUDDY_OLLAMA_URL", "http://127.0.0.1:9")  # nothing there -> rule fallback
    srv = make_server("127.0.0.1", 0)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{srv.server_address[1]}"
    try:
        assert json.load(urllib.request.urlopen(base + "/api/health"))["ok"]
        meds = _post(base, "/api/extract", {"text": "thyroid 50 mcg early morning empty stomach. calcium tablet after breakfast"})["meds"]
        plan = _post(base, "/api/plan", {"meds": meds, "name": "Amma", "lang": "en"})
        assert any(w["level"] == "danger" for w in plan["warnings"])
        assert json.load(urllib.request.urlopen(base + "/api/plan"))["name"] == "Amma"
    finally:
        srv.shutdown()
