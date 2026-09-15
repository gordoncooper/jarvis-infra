#!/bin/bash
set -euo pipefail
if [ "$(whoami)" != agent ]; then echo FATAL: run as agent >&2; exit 1; fi
ROOT=$(cd "$(dirname "$0")/.." && pwd)
TMP=$(mktemp)
trap 'rm -f "$TMP"' EXIT

ssh -n -o BatchMode=yes apps-01 'sudo cat /cluster/local/openclaw/learned.md' > "$TMP"
ssh -o BatchMode=yes data-01 "sudo tee /cluster/nfs/jarvis/learned.md >/dev/null && sudo chmod 666 /cluster/nfs/jarvis/learned.md" < "$TMP"

SECRET=$(kubectl -n apps get secret open-webui -o jsonpath='{.data.WEBUI_SECRET_KEY}' | base64 -d)
WEBUI_UID=$(ssh -n -o BatchMode=yes apps-01 "sudo python3 -c \"
import sqlite3
c=sqlite3.connect('/cluster/local/open-webui/webui.db')
c.row_factory=sqlite3.Row
rows=c.execute('select id,role from user').fetchall()
admin=next((r for r in rows if (r['role'] or '')=='admin'), rows[0])
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
export TOKEN
export BRIEF_FILE="$TMP"
python3 - << 'PY'
import json, os, ssl, urllib.request
from pathlib import Path
api = "https://chat.lan/api/v1"
token = os.environ["TOKEN"]
ctx = ssl._create_unverified_context()
brief = Path(os.environ["BRIEF_FILE"]).read_bytes()

def req(method, url, data=None, headers=None):
    h = {"Authorization": "Bearer " + token}
    if headers:
        h.update(headers)
    r = urllib.request.Request(url, data=data, method=method, headers=h)
    with urllib.request.urlopen(r, context=ctx, timeout=60) as resp:
        body = resp.read()
        return json.loads(body) if body else {}

raw = req("GET", api + "/knowledge/")
know = raw if isinstance(raw, list) else (raw.get("items") or [])
coll = next((k for k in know if (k.get("name") or "") == "jarvis-learned"), None)
if not coll:
    coll = req("POST", api + "/knowledge/create",
               data=json.dumps({"name": "jarvis-learned", "description": "Promoted facts (learned.md)"}).encode(),
               headers={"Content-Type": "application/json"})
    print("created collection", coll.get("id"))
else:
    cid = coll["id"]
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

boundary = "----jarvislearned"
filename = "learned.md"
disp = 'Content-Disposition: form-data; name="file"; filename="%s"\r\n' % filename
head = ("--" + boundary + "\r\n" + disp + "Content-Type: text/markdown\r\n\r\n").encode()
tail = ("\r\n--" + boundary + "--\r\n").encode()
file_obj = req("POST", api + "/files/", data=head + brief + tail,
               headers={"Content-Type": "multipart/form-data; boundary=" + boundary})
fid = file_obj.get("id")
if not fid:
    raise SystemExit(f"upload failed: {file_obj!r}")
print("uploaded", fid, "bytes", len(brief))
req("POST", api + "/knowledge/" + coll["id"] + "/file/add",
    data=json.dumps({"file_id": fid}).encode(),
    headers={"Content-Type": "application/json"})
print("added to jarvis-learned")
PY
unset TOKEN
bash "$ROOT/scripts/refresh-goose-context.sh"
echo "seed-learned OK"
