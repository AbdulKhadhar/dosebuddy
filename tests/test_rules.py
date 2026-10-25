from dosebuddy.rules import check, parse

def _levels(text):
    return [w["level"] for w in check(parse(text))[1]]

def test_thyroid_calcium_same_slot():
    assert "danger" in _levels("thyroid tablet 50 mcg early morning empty stomach, calcium tablet morning after breakfast".replace(",", "."))

def test_missing_info_is_flagged():
    meds = parse("Doctor gave me this new tablet after breakfast, but I already take BP medicine.")
    assert len(meds) == 2 and any("no time" in w["text"] for w in check(meds)[1])

def test_clean_schedule_has_no_danger():
    assert "danger" not in _levels("metformin 500 mg after lunch and thyroid 50 mcg early morning empty stomach")

def test_duplicate_and_double_painkiller():
    assert "danger" in _levels("ibuprofen 400 mg after lunch. diclofenac 50 mg after lunch")
