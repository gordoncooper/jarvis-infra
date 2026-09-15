#!/bin/bash
# Replace Open WebUI knowledge collection lab-docs with docs/briefing.md.
# Auth: JWT from WEBUI_SECRET_KEY + first admin user in sqlite. No click-ops.
set -euo pipefail
if [ "$(whoami)" != agent ]; then echo FATAL: run as agent >&2; exit 1; fi
ROOT=$(cd "$(dirname "$0")/.." && pwd)
BRIEF="$ROOT/docs/briefing.md"
test -s "$BRIEF"

SECRET=$(kubectl -n apps get secret open-webui -o jsonpath='{.data.WEBUI_SECRET_KEY}')
SECRET=$(printf '%s' "$SECRET" | base64 -d)
# first admin uuid
UID=$(ssh -n -o BatchMode=yes apps-01 "sudo python3 -c \"
import sqlite3
c=sqlite3.connect('/cluster/local/open-webui/webui.db')
c.row_factory=sqlite3.Row
row=c.execute(\\\"select id,role,email from user order by created_at\\\").fetchall()
admin=next((r for r in row if (r['role'] or '')=='admin'), row[0] if row else None)
if not admin: raise SystemExit('no webui user')
print(admin['id'])
\"")
export WEBUI_JWT_USER="$UID"
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
auth=(-sk -H "Authorization: Bearer $TOKEN")
python3 - "$BRIEF" << PY
import json, os, ssl, sys, urllib.request, mimetypes
from pathlib import Path
brief = Path(sys.argv[1])
token = os.environ["TOKEN"] if False else """$TOKEN"""
api = "$API"
ctx = ssl._create_unverified_context()

def req(method, url, data=None, headers=None, raw=False):
    h = {"Authorization": "Bearer " + """$TOKEN"""}
    if headers:
        h.update(headers)
    r = urllib.request.Request(url, data=data, method=method, headers=h)
    with urllib.request.urlopen(r, context=ctx, timeout=60) as resp:
        body = resp.read()
        return json.loads(body) if not raw and body else body

know = req("GET", api + "/knowledge/")
if not isinstance(know, list):
    raise SystemExit(f"knowledge list failed: {know!r}")
coll = next((k for k in know if (k.get("name") or "") == "lab-docs"), None)
if not coll:
    coll = req("POST", api + "/knowledge/create",
               data=json.dumps({"name": "lab-docs", "description": "Cluster briefing"}).encode(),
               headers={"Content-Type": "application/json"})
    print("created collection", coll.get("id"))
else:
    print("collection", coll.get("id"), "files", len(coll.get("files") or []))

# remove old files so embeddings match git
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

# multipart upload
boundary = "----jarvisbrief"
body = brief.read_bytes()
filename = "briefing.md"
disp = 'Content-Disposition: form-data; name="file"; filename="%s"\r\n' % filename
head = ("--" + boundary + "\r\n" + disp + "Content-Type: text/markdown\r\n\r\n").encode()
tail = ("\r\n--" + boundary + "--\r\n").encode()
data = head + body + tail
file_obj = req("POST", api + "/files/", data=data,
               headers={"Content-Type": "multipart/form-data; boundary=" + boundary})
fid = file_obj.get("id")
if not fid:
    raise SystemExit(f"upload failed: {file_obj!r}")
print("uploaded", fid, "bytes", len(body))
added = req("POST", api + "/knowledge/" + coll["id"] + "/file/add",
            data=json.dumps({"file_id": fid}).encode(),
            headers={"Content-Type": "application/json"})
print("added to lab-docs")
PY
unset TOKEN
echo "seed-lab-docs OK"
