"""SQLite persistence. Swap this module to change where plans are kept."""
import json
import sqlite3
from contextlib import closing

from . import config

def _open():
    c = sqlite3.connect(config.data_dir() / "dosebuddy.db")
    c.execute("create table if not exists plan(id integer primary key, created text default current_timestamp, body text)")
    return c

def save_plan(plan):
    with closing(_open()) as c:
        c.execute("insert into plan(body) values(?)", (json.dumps(plan),))
        c.commit()

def latest_plan():
    with closing(_open()) as c:
        row = c.execute("select body from plan order by id desc limit 1").fetchone()
    return json.loads(row[0]) if row else {}
