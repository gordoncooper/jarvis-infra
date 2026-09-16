#!/bin/bash
set -euo pipefail
JSON="${1:-$HOME/cluster/clusters/jarvis/apps/jarvis-local-model.json}"
test -s "$JSON"
scp "$JSON" apps-01:/tmp/jarvis-local-model.json
ssh apps-01 'sudo python3 -' << 'PY'
import json, sqlite3, time
from pathlib import Path
d=json.loads(Path("/tmp/jarvis-local-model.json").read_text())
params=json.dumps(d.get("params") or {})
meta=json.dumps(d.get("meta") or {})
c=sqlite3.connect("/cluster/local/open-webui/webui.db")
now=int(time.time())
row=c.execute("select id from model where id=?", (d["id"],)).fetchone()
if row:
    c.execute("update model set name=?, params=?, meta=?, updated_at=? where id=?",
              (d["name"], params, meta, now, d["id"]))
    print("updated", d["id"])
else:
    c.execute("insert into model (id,user_id,base_model_id,name,params,meta,updated_at,created_at,is_active) values (?,?,?,?,?,?,?,?,1)",
              (d["id"], None, d.get("base_model_id"), d["name"], params, meta, now, now))
    print("inserted", d["id"])
# also overlay the LiteLLM alias so default `jarvis` gets prompt+RAG
d2=dict(d); d2["id"]="jarvis"; d2["name"]="JARVIS"
params2=json.dumps(d2.get("params") or {})
meta2=json.dumps(d2.get("meta") or {})
row=c.execute("select id from model where id=?", ("jarvis",)).fetchone()
if row:
    c.execute("update model set name=?, params=?, meta=?, updated_at=? where id=?",
              (d2["name"], params2, meta2, now, "jarvis"))
    print("updated jarvis")
else:
    c.execute("insert into model (id,user_id,base_model_id,name,params,meta,updated_at,created_at,is_active) values (?,?,?,?,?,?,?,?,1)",
              ("jarvis", None, None, d2["name"], params2, meta2, now, now))
    print("inserted jarvis")
c.commit()
PY
kubectl -n apps rollout restart deploy/open-webui
kubectl -n apps rollout status deploy/open-webui --timeout=180s
