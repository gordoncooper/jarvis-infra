#!/bin/bash
set -euo pipefail
if [ "$(whoami)" != agent ]; then echo FATAL: run as agent >&2; exit 1; fi
export KUBECONFIG="${KUBECONFIG:-/home/agent/.kube/config}"
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
python3 - "$TOKEN" << 'PY'
import json, ssl, sys, urllib.request, urllib.error
token = sys.argv[1]
ctx = ssl._create_unverified_context()
api = "https://chat.lan/api/v1"
TITLE = "Voice"
MODEL = "jarvis"

def parse(raw):
    if isinstance(raw, bytes):
        s = raw.decode(errors="replace")
    else:
        s = raw or "null"
    s = s.strip() or "null"
    try:
        return json.loads(s)
    except json.JSONDecodeError:
        obj, _end = json.JSONDecoder().raw_decode(s)
        return obj

def req(method, path, data=None):
    body = None if data is None else json.dumps(data).encode()
    r = urllib.request.Request(
        api + path, data=body, method=method,
        headers={"Authorization": "Bearer " + token, "Content-Type": "application/json", "Accept": "application/json"},
    )
    try:
        with urllib.request.urlopen(r, context=ctx, timeout=30) as resp:
            return resp.status, parse(resp.read())
    except urllib.error.HTTPError as e:
        raw = e.read()[:800]
        try:
            return e.code, parse(raw)
        except Exception:
            return e.code, raw

def flatten(obj):
    if obj is None:
        return []
    if isinstance(obj, list):
        return obj
    if isinstance(obj, dict):
        for k in ("items", "chats", "data"):
            if isinstance(obj.get(k), list):
                return obj[k]
        if "id" in obj and ("title" in obj or "chat" in obj):
            return [obj]
    return []

chats = []
code, body = req("GET", "/chats/")
print("GET /chats/", code, type(body).__name__, "n", len(flatten(body)))
chats.extend(flatten(body))
code, body = req("GET", "/chats/pinned")
print("GET /chats/pinned", code, type(body).__name__)
chats.extend(flatten(body))

def title_of(c):
    if not isinstance(c, dict):
        return ""
    chat = c.get("chat") if isinstance(c.get("chat"), dict) else c
    return str(chat.get("title") or c.get("title") or "")

found = None
for c in chats:
    if title_of(c).strip() == TITLE and c.get("id"):
        found = c
        break

if found:
    cid = found["id"]
    print("exists", cid)
else:
    payload = {
        "chat": {
            "title": TITLE,
            "models": [MODEL],
            "history": {"messages": {}, "currentId": None},
            "messages": [],
        }
    }
    code, body = req("POST", "/chats/new", payload)
    print("POST /chats/new", code)
    if not isinstance(body, dict) or not body.get("id"):
        raise SystemExit(f"create failed: {body!r}")
    cid = body["id"]
    print("created", cid)

code, body = req("POST", f"/chats/{cid}/pin", {})
print("POST pin", code, body if not isinstance(body, (dict, list)) else "ok")
if code not in (200, 201) and isinstance(body, dict) and not body.get("pinned", True):
    code2, body2 = req("POST", f"/chats/{cid}", {"pinned": True, "chat": {"title": TITLE, "pinned": True}})
    print("POST update pinned", code2)

print("VOICE_CHAT", cid)
print("open https://chat.lan  sidebar: Voice (pinned)  model: jarvis  then Call")
print("ENSURE_VOICE_OK")
PY
