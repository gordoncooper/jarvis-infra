#!/bin/bash
# App probe — Grafana / Prometheus / exporters. Images + HTTP codes. No admin secrets.
set -euo pipefail
if [ "$(whoami)" != agent ]; then echo FATAL: run as agent >&2; exit 1; fi

printf '\n========== APP monitoring ==========\n'
date -Is

echo
echo "--- workloads ---"
kubectl -n monitoring get deploy,ds,svc,ingress --no-headers
echo
echo "--- images ---"
kubectl -n monitoring get deploy,ds -o json | python3 -c '
import json,sys
d=json.load(sys.stdin)
for it in d.get("items",[]):
    kind=it["kind"]
    name=it["metadata"]["name"]
    spec=it["spec"]["template"]["spec"]
    ns=spec.get("nodeSelector")
    for c in spec.get("containers") or []:
        print(kind, name, c.get("name"), c.get("image"), "policy", c.get("imagePullPolicy"), "nodesel", ns)
'

echo
echo "--- http grafana.lan ---"
python3 - << 'PY'
import ssl, urllib.request
ctx = ssl._create_unverified_context()
for url in ("https://grafana.lan/", "https://grafana.lan/login", "https://grafana.lan/api/health"):
    try:
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req, timeout=10, context=ctx) as r:
            ctype = r.headers.get("content-type","")
            body = r.read(4000)
            print(r.status, url, ctype, "bytes", len(body))
            if "json" in ctype.lower():
                print(" ", body[:200].decode("utf-8","replace"))
    except Exception as e:
        print("FAIL", url, type(e).__name__)
PY

echo
echo "--- prometheus flags (no data) ---"
kubectl -n monitoring get deploy prometheus -o json | python3 -c '
import json,sys
d=json.load(sys.stdin)
c=d["spec"]["template"]["spec"]["containers"][0]
print("args", c.get("args") or c.get("command"))
'

echo
echo "--- grafana-admin file meta ---"
if [ -f "$HOME/.grafana-admin" ]; then
  stat -c "EXISTS mode=%a size=%s" "$HOME/.grafana-admin"
else
  echo MISS
fi

echo
echo "========== DONE APP monitoring =========="
echo "DISCOVER_OK app=monitoring no admin secret"
