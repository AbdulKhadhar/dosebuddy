"""Deterministic layer: parsing fallback + safety checks. The LLM never decides safety."""
import json
import pathlib
import re
SLOTS = ["morning", "afternoon", "night"]
FOODS = ["any", "before", "after", "with", "empty"]
G = json.loads((pathlib.Path(__file__).parent / "data" / "groups.json").read_text(encoding="utf-8"))
def group(name):
    n = (name or "").lower()
    for g, words in G.items():
        if any(re.search(r"\b" + w, n) for w in words.split()):
            return g

def normalize(m):
    times = [t for t in m.get("times", []) if t in SLOTS]
    food = m.get("food") if m.get("food") in FOODS else "any"
    return {"name": str(m.get("name", "")).strip(), "dose": str(m.get("dose", "")).strip(),
            "times": [s for s in SLOTS if s in times], "food": food}

TIME_RX = {"morning": r"morning|breakfast|sunrise", "afternoon": r"lunch|afternoon|noon",
           "night": r"night|dinner|bedtime|evening|supper"}
STOP = r"\b(take|takes|taking|tablets?|tabs?|capsules?|medicine|medicines|pills?|after|before|with|food|meal|stomach|empty|early|in|on|to|of|for|the|at|a|my|doctor|gave|me|this|new|but|i|already|also|once|twice|daily|day|morning|afternoon|night|breakfast|lunch|dinner|bedtime|evening|every|per|times?)\b"

def parse(text):
    """Rule-based fallback when no local LLM is running."""
    meds = []
    for seg in re.split(r"[.;\n]|,|\band\b", text, flags=re.I):
        s = seg.strip().lower()
        if not s:
            continue
        times = [t for t, rx in TIME_RX.items() if re.search(rx, s)]
        if re.search(r"twice|two times|\bbd\b", s) and not times: times = ["morning", "night"]
        if re.search(r"thrice|three times|\btds\b", s): times = list(SLOTS)
        food = "any"
        if "empty stomach" in s: food = "empty"
        elif re.search(r"before (food|meal|breakfast|lunch|dinner)", s): food = "before"
        elif re.search(r"after|post", s) and re.search(r"food|meal|breakfast|lunch|dinner", s): food = "after"
        elif re.search(r"with (food|meal)", s): food = "with"
        dm = re.search(r"\d+(\.\d+)?\s?(mg|mcg|g|ml)\b", s)
        dose = dm.group(0) if dm else ""
        name = re.sub(r"\d+(\.\d+)?\s?(mg|mcg|g|ml)\b", " ", s)
        name = " ".join(re.sub(STOP, " ", name).split())
        if not name and (times or dose):
            name = "(name not heard)"
        if name:
            meds.append(normalize({"name": name, "dose": dose, "times": times, "food": food}))
    return meds

def check(meds):
    w, add = [], lambda lvl, t: w.append({"level": lvl, "text": t})
    slots = {s: [m for m in meds if s in m["times"]] for s in SLOTS}
    seen = {}
    for m in meds:
        n = m["name"] or "A medicine"
        if not m["name"] or m["name"].startswith("("): add("warn", "A medicine has no name. Check the strip or ask the pharmacist.")
        if not m["times"]: add("warn", f"{n}: no time of day chosen. Ask the doctor how often to take it.")
        if not m["dose"]: add("info", f"{n}: dose is missing. Copy it from the prescription.")
        k = m["name"].lower()
        if k in seen: add("warn", f"{n} is listed twice. Make sure it is not taken twice by mistake.")
        seen[k] = 1
        g = group(m["name"])
        if g == "thyroid" and m["food"] not in ("empty", "before"):
            add("warn", f"{n}: thyroid tablets are usually taken on an empty stomach. Confirm with the doctor.")
        if g == "metformin" and m["food"] == "empty":
            add("warn", f"{n}: metformin is usually taken with or after food. Confirm with the doctor.")
    for s, ms in slots.items():
        gs = {group(m["name"]) for m in ms}
        if "thyroid" in gs and gs & {"calcium", "iron", "antacid"}:
            add("danger", f"At {s}: thyroid tablet is together with calcium, iron or antacid. Keep them about 4 hours apart. Ask the pharmacist.")
        if sum(1 for m in ms if group(m["name"]) == "nsaid") > 1:
            add("danger", f"At {s}: two pain-killers of the same kind. Do not take together without asking the doctor.")
        if any(m["food"] == "empty" for m in ms) and any(m["food"] in ("after", "with") for m in ms):
            add("warn", f"At {s}: one tablet needs an empty stomach and another needs food. Ask how to space them.")
        if len(ms) >= 5:
            add("info", f"At {s}: {len(ms)} medicines at once. Ask the pharmacist if any can be moved.")
    allg = {group(m["name"]) for m in meds}
    if "nsaid" in allg and "bp" in allg:
        add("warn", "Pain-killers (like ibuprofen or diclofenac) can affect blood pressure medicine. Ask the doctor.")
    return slots, w
