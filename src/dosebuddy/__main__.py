import os
import threading
import webbrowser

from .server import make_server

def main():
    port = int(os.environ.get("DOSEBUDDY_PORT", "8000"))
    try:
        srv = make_server("127.0.0.1", port)
    except OSError:
        raise SystemExit(f"Port {port} is busy. Close the other DoseBuddy window, or set DOSEBUDDY_PORT to another number.")
    url = f"http://127.0.0.1:{port}"
    print(f"DoseBuddy is running at {url}\nPress Ctrl+C (or close this window) to stop.")
    if not os.environ.get("DOSEBUDDY_NO_BROWSER"):
        threading.Timer(0.8, webbrowser.open, [url]).start()
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\nBye")

if __name__ == "__main__":
    main()
