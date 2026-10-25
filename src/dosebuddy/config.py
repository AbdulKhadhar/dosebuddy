"""All settings in one place. Everything can be changed with environment variables."""
import os
import pathlib

STATIC = pathlib.Path(__file__).parent / "static"

def data_dir():
    p = pathlib.Path(os.environ.get("DOSEBUDDY_DATA") or pathlib.Path.home() / ".dosebuddy")
    p.mkdir(parents=True, exist_ok=True)
    return p

def model():
    return os.environ.get("DOSEBUDDY_MODEL", "qwen2.5:1.5b-instruct")

def ollama_url():
    return os.environ.get("DOSEBUDDY_OLLAMA_URL", "http://127.0.0.1:11434")
