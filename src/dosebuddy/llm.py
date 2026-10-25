"""Optional local model (Ollama). Returns None on any problem so callers fall back to rules."""
import json
import urllib.request

from . import config
from .rules import normalize

PROMPT = ('Extract medicines from the text. Return JSON only: {"meds":[{"name":str,"dose":str,'
          '"times":["morning"|"afternoon"|"night"],"food":"before"|"after"|"with"|"empty"|"any"}]}. '
          'Use only what the text says. If dose or time is not said, use "" or []. Text: ')

def extract_meds(text):
    try:
        body = json.dumps({"model": config.model(), "prompt": PROMPT + text, "stream": False,
                           "format": "json", "options": {"temperature": 0}}).encode()
        req = urllib.request.Request(config.ollama_url() + "/api/generate", body, {"Content-Type": "application/json"})
        out = json.load(urllib.request.urlopen(req, timeout=60))["response"]
        meds = [normalize(m) for m in json.loads(out)["meds"] if isinstance(m, dict)]
        return [m for m in meds if m["name"]] or None
    except Exception:
        return None
