#!/bin/bash
# App probe — Open WebUI / chat.lan. Env names, sqlite names. No JWT, no API keys.
set -euo pipefail
if [ "$(whoami)" != agent ]; then echo FATAL: run as agent >&2; exit 1; fi

printf '\n========== APP open-webui ==========\n'
date -Is

echo
echo "--- deploy ---"
kubectl -n apps get deploy open-webui -o json | python3 -c '
import json,sys
d=json.load(sys.stdin)
spec=d["spec"]["template"]["spec"]
c=spec["containers"][0]
print("image", c.get("image"))
print("policy", c.get("imagePullPolicy"))
print("sa", spec.get("serviceAccountName"))
print("nodesel", spec.get("nodeSelector"))
print("env", sorted(e.get("name") for e in (c.get("env") or [])))
print("mounts", sorted(m.get("name") for m in (c.get("volumeMounts") or [])))
print("vols", sorted(v.get("name") for v in (spec.get("volumes") or [])))
'
kubectl -n apps get pod -l app=open-webui -o wide --no-headers

echo
echo "--- http title ---"
python3 - << 'PY'
import ssl, urllib.request, re
ctx = ssl._create_unverified_context()
url = "https://chat.lan/"
try:
    with urllib.request.urlopen(url, timeout=10, context=ctx) as r:
        b = r.read(16000).decode("utf-8", "replace")
        title = (re.search(r"<title>([^<]+)</title>", b, re.I) or type("x",(),{"group":lambda s,i: "?"})()).group(1)
        print(r.status, "bytes", len(b), "title", title.strip())
        print("hud_css", "jarvis-hud" in b)
except Exception as e:
    print("FAIL", type(e).__name__)
PY

echo
echo "--- sqlite names (ssh apps-01) ---"
ssh -o BatchMode=yes apps-01 'sudo python3 -' << 'PY'
import sqlite3
c = sqlite3.connect("/cluster/local/open-webui/webui.db")
c.row_factory = sqlite3.Row
print("knowledge")
for r in c.execute("select name, description from knowledge"):
    print(" ", r["name"], "|", (r["description"] or "")[:60])
print("functions")
for r in c.execute("select id, name, type, is_active, is_global, length(content) from function"):
    print(" ", r["id"], r["name"], r["type"], "active="+str(r["is_active"]), "bytes="+str(r[5]))
print("models")
for r in c.execute("select id, name, is_active from model"):
    print(" ", r["id"], "name="+r["name"], "active="+str(r["is_active"]))
secretish = ("key","token","secret","password")
print("config_keys (value meta)")
for r in c.execute("select key, typeof(value), length(cast(value as text)) from config"):
    k = r[0] or ""
    if not any(x in k.lower() for x in ("ui.","audio.tts","task.follow","default_model","hidden_model","arena","openai.enable","openai.api_base")):
        continue
    kl = k.lower()
    if any(s in kl for s in secretish):
        print(" ", k, "SECRETISH len="+str(r[2]))
    else:
        val = c.execute("select cast(value as text) from config where key=?", (k,)).fetchone()[0]
        s = (val or "")[:80].replace("\n"," ")
        print(" ", k, "=", s)
PY

echo
echo "========== DONE APP open-webui =========="
echo "DISCOVER_OK app=open-webui no keys"
