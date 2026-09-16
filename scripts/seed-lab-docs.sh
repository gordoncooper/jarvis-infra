#!/bin/bash
# Replace Open WebUI knowledge collection lab-docs with docs/briefing.md.
set -euo pipefail
if [ "$(whoami)" != agent ]; then echo FATAL: run as agent >&2; exit 1; fi
ROOT=$(cd "$(dirname "$0")/.." && pwd)
BRIEF="$ROOT/docs/briefing.md"
test -s "$BRIEF"

SECRET=$(kubectl -n apps get secret open-webui -o jsonpath='{.data.WEBUI_SECRET_KEY}')
SECRET=$(printf '%s' "$SECRET" | base64 -d)
WEBUI_UID=$(ssh -n -o BatchMode=yes apps-01 "sudo python3 -c \"
import sqlite3
c=sqlite3.connect('/cluster/local/open-webui/webui.db')
c.row_factory=sqlite3.Row
row=c.execute(\\\"select id,role,email from user order by created_at\\\").fetchall()
admin=next((r for r in row if (r['role'] or '')=='admin'), row[0] if row else None)
if not admin: raise SystemExit('no webui user')
print(admin['id'])
\"")
export WEBUI_JWT_USER="$WEBUI_UID"
export WEBUI_JWT_SECRET="$SECRET"
TOKEN=$(python3 - << 'PY'
import base64, hmac, hashlib, json, os
def b64(b):
    return base64.urlsafe_b64encode(b).rstrip(b"=")
header = b64(json.dumps({"alg":"HS256","typ":"JWT"}, separators=(",",":")).encode())
payload = b64(json.dumps({"id": os.environ["WEBUI_JWT_USER"]}, separators=(",",":")).encode())
sig = hmac.new(os.environ["WEBUI_JWT_SECRET"].encode(), header + b"." + payload, hashlib.sha256).digest()
print((header + b"." + payload + b"." + b64(sig)).decode())
PY
)
unset WEBUI_JWT_SECRET SECRET
export -n WEBUI_JWT_SECRET || true

API=https://chat.lan/api/v1
export TOKEN
python3 - "$BRIEF" "$API" "$TOKEN" << 'PY'
import json, os, ssl, sys, time, urllib.request, urllib.error
from pathlib import Path
brief = Path(sys.argv[1])
api = sys.argv[2]
token = sys.argv[3]
ctx = ssl._create_unverified_context()

def req(method, url, data=None, headers=None):
    h = {"Authorization": "Bearer " + token}
    if headers:
        h.update(headers)
    r = urllib.request.Request(url, data=data, method=method, headers=h)
    with urllib.request.urlopen(r, context=ctx, timeout=90) as resp:
        body = resp.read()
        return json.loads(body) if body else {}

raw = req("GET", api + "/knowledge/")
know = raw if isinstance(raw, list) else (raw.get("items") or raw.get("knowledge") or [])
if not isinstance(know, list):
    raise SystemExit("knowledge list failed: %r" % (raw,))
coll = next((k for k in know if (k.get("name") or "") == "lab-docs"), None)
if not coll:
    coll = req("POST", api + "/knowledge/create",
               data=json.dumps({"name": "lab-docs", "description": "Cluster briefing"}).encode(),
               headers={"Content-Type": "application/json"})
    print("created collection", coll.get("id"))
else:
    cid = coll.get("id")
    try:
        detail = req("GET", api + "/knowledge/" + cid)
        if isinstance(detail, dict):
            coll = detail
    except Exception:
        pass
    print("collection", coll.get("id"), "files", len(coll.get("files") or []))

for f in list(coll.get("files") or []):
    fid = f.get("id") or f.get("file_id")
    if not fid:
        continue
    try:
        req("POST", api + "/knowledge/" + coll["id"] + "/file/remove",
            data=json.dumps({"file_id": fid}).encode(),
            headers={"Content-Type": "application/json"})
        print("removed", fid)
    except Exception as e:
        print("remove skip", fid, e)

boundary = "----jarvisbrief"
filename = "briefing.md"
body = brief.read_bytes() + ("\n\n<!-- seed %s -->\n" % time.time()).encode()
disp = 'Content-Disposition: form-data; name="file"; filename="%s"\r\n' % filename
head = ("--" + boundary + "\r\n" + disp + "Content-Type: text/markdown\r\n\r\n").encode()
tail = ("\r\n--" + boundary + "--\r\n").encode()
file_obj = req("POST", api + "/files/", data=head + body + tail,
               headers={"Content-Type": "multipart/form-data; boundary=" + boundary})
fid = file_obj.get("id")
if not fid:
    raise SystemExit("upload failed: %r" % (file_obj,))
print("uploaded", fid, "bytes", len(body))

status = "pending"
for _ in range(30):
    meta = req("GET", api + "/files/" + fid)
    status = str((meta.get("data") or {}).get("status") or "")
    print("file_status", status)
    if status.startswith("complet"):
        break
    if status in ("failed", "error"):
        raise SystemExit("file process failed: %r" % (meta.get("data"),))
    time.sleep(1)

added = False
for i in range(4):
    url = api + "/knowledge/" + coll["id"] + "/file/add"
    r = urllib.request.Request(
        url,
        data=json.dumps({"file_id": fid}).encode(),
        method="POST",
        headers={"Authorization": "Bearer " + token, "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(r, context=ctx, timeout=90) as resp:
            resp.read()
        added = True
        print("added to lab-docs")
        break
    except urllib.error.HTTPError as e:
        err = e.read().decode("utf-8", "replace")
        print("add retry", i, e.code, err[:240])
        if e.code == 400 and "Duplicate content" in err:
            print("duplicate after unique seed — unexpected")
        time.sleep(2)
if not added:
    raise SystemExit("knowledge add failed")
PY
unset TOKEN
echo "seed-lab-docs OK"
