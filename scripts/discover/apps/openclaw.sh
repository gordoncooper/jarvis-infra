#!/bin/bash
# App probe — OpenClaw. No gateway token, no MEMORY.md body.
set -euo pipefail
if [ "$(whoami)" != agent ]; then echo FATAL: run as agent >&2; exit 1; fi

printf '\n========== APP openclaw ==========\n'
date -Is

echo
echo "--- deploy/pod/svc/ingress ---"
kubectl -n agents get deploy,pod,svc,ingress -o wide --no-headers 2>/dev/null || echo "agents MISS"

echo
echo "--- containers ---"
kubectl -n agents get deploy openclaw -o json | python3 -c '
import json,sys
d=json.load(sys.stdin)
spec=d["spec"]["template"]["spec"]
print("sa", spec.get("serviceAccountName"))
print("nodesel", spec.get("nodeSelector"))
for c in spec.get("containers") or []:
    ports = ",".join(str(p.get("containerPort")) for p in (c.get("ports") or []))
    print("cont", c.get("name"), "image", c.get("image"), "policy", c.get("imagePullPolicy"), "ports", ports or "-")
    envs = [e.get("name") for e in (c.get("env") or [])]
    print("  env_names", envs)
'

echo
echo "--- skills (names only) ---"
POD=$(kubectl -n agents get pod -l app=openclaw -o jsonpath="{.items[0].metadata.name}" 2>/dev/null || true)
if [ -n "$POD" ]; then
  echo "pod=$POD"
  kubectl -n agents exec "$POD" -c openclaw -- sh -c "ls -1 /home/node/.openclaw/skills 2>/dev/null; ls -1 /app/skills 2>/dev/null" | grep -v '^\.\.' || true
else
  echo "pod MISS"
fi

echo
echo "--- healthz (code + keys, no token) ---"
python3 - << 'PY'
import json, urllib.request
url = "http://agent.lan:18789/healthz"
try:
    with urllib.request.urlopen(url, timeout=8) as r:
        body = r.read(2000)
        print(r.status, url, r.headers.get("content-type"), "bytes", len(body))
        try:
            d = json.loads(body.decode())
            print("keys", sorted(d.keys()) if isinstance(d, dict) else type(d).__name__)
        except Exception:
            print("body_head", body[:80])
except Exception as e:
    print("FAIL", type(e).__name__)
PY

echo
echo "--- token file meta only ---"
if [ -f "$HOME/.openclaw-gateway.token" ]; then
  stat -c "EXISTS mode=%a size=%s path=%n" "$HOME/.openclaw-gateway.token"
else
  echo "token file MISS"
fi

echo
echo "========== DONE APP openclaw =========="
echo "DISCOVER_OK app=openclaw no token"
