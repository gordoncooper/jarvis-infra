#!/bin/bash
# App probe — Gitea / git.lan. HTTP origin. No tokens, no app.ini secrets.
set -euo pipefail
if [ "$(whoami)" != agent ]; then echo FATAL: run as agent >&2; exit 1; fi

printf '\n========== APP gitea ==========\n'
date -Is

echo
echo "--- deploy ---"
kubectl -n gitea get deploy,pod,svc,ingress -o wide --no-headers
kubectl -n gitea get deploy -o json | python3 -c '
import json,sys
d=json.load(sys.stdin)
for it in d.get("items",[]):
    spec=it["spec"]["template"]["spec"]
    c=spec["containers"][0]
    print("name", it["metadata"]["name"])
    print("image", c.get("image"))
    print("policy", c.get("imagePullPolicy"))
    print("sa", spec.get("serviceAccountName"))
    print("nodesel", spec.get("nodeSelector"))
    print("env", sorted(e.get("name") for e in (c.get("env") or [])))
    print("mounts", sorted(m.get("mountPath") for m in (c.get("volumeMounts") or [])))
'

echo
echo "--- http git.lan ---"
python3 - << 'PY'
import urllib.request
url = "http://git.lan/"
try:
    req = urllib.request.Request(url, method="GET")
    with urllib.request.urlopen(req, timeout=10) as r:
        print(r.status, url, r.headers.get("content-type"), "bytes", r.headers.get("content-length") or len(r.read(2000)))
except Exception as e:
    print("FAIL", type(e).__name__)
PY

echo
echo "--- hostPath on ctrl-01 (names only) ---"
ssh -n -o BatchMode=yes ctrl-01 'sudo ls -ld /cluster/local/gitea /cluster/local/gitea/gitea 2>/dev/null; sudo ls -ld /cluster/local/gitea/gitea/gitea.db 2>/dev/null || true'

echo
echo "========== DONE APP gitea =========="
echo "DISCOVER_OK app=gitea HTTP no tokens"
