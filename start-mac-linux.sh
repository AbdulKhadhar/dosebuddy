#!/usr/bin/env sh
cd "$(dirname "$0")" || exit 1
PY=$(command -v python3 || command -v python) || { echo "Install Python 3.9+ from https://www.python.org/downloads/"; exit 1; }
PYTHONPATH=src exec "$PY" -m dosebuddy
