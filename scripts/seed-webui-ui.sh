#!/bin/bash
# Persistent Open WebUI UI bits (picker whitelist, default, arena off).
# Does not print or rotate API keys. Run as agent. No ssh -n on this stdin.
set -euo pipefail
if [ "$(whoami)" != agent ]; then echo FATAL: run as agent >&2; exit 1; fi
ssh -o BatchMode=yes apps-01 'sudo python3 -' << 'PY'
import sqlite3, json, time
c = sqlite3.connect("/cluster/local/open-webui/webui.db")
now = int(time.time())
# Must match what break-glass needs. jarvis-hands was missing here while
# being present live and documented in INTERACT, so re-running this
# during a rebuild would have quietly dropped Hands from the picker.
allow = ["jarvis-local", "jarvis-grok", "jarvis-grok-code", "jarvis-hands"]

def upsert(key, value):
    raw = json.dumps(value)
    if c.execute("select 1 from config where key=?", (key,)).fetchone():
        c.execute("update config set value=?, updated_at=? where key=?", (raw, now, key))
        print("updated", key)
    else:
        c.execute("insert into config(key,value,updated_at) values (?,?,?)", (key, raw, now))
        print("inserted", key)

upsert("ui.default_models", "jarvis-local")
upsert("ui.hidden_models", ["jarvis-embed"])
upsert("evaluation.arena.enable", False)
upsert("ui.enable_evaluation_arena_models", False)
cfg = c.execute("select value from config where key=?", ("openai.api_configs",)).fetchone()
obj = json.loads(cfg[0]) if cfg else {}
block = {
    "enable": True,
    "tags": [],
    "prefix_id": "",
    "model_ids": allow,
    "connection_type": "external",
}
if not obj:
    obj = {"0": block}
elif isinstance(obj, dict):
    for k, v in list(obj.items()):
        if isinstance(v, dict):
            v["model_ids"] = allow
            v["enable"] = True
            obj[k] = v
    if not obj:
        obj = {"0": block}
else:
    obj = {"0": block}
upsert("openai.api_configs", obj)
row = c.execute("select id from model where id=?", ("jarvis-embed",)).fetchone()
if row:
    c.execute("update model set is_active=0, updated_at=? where id=?", (now, "jarvis-embed"))
c.commit()
print("default", c.execute("select value from config where key=?", ("ui.default_models",)).fetchone()[0])
print("hidden", c.execute("select value from config where key=?", ("ui.hidden_models",)).fetchone()[0])
print("arena", c.execute("select value from config where key=?", ("evaluation.arena.enable",)).fetchone()[0])
print("SEED_WEBUI_UI_OK")
PY
