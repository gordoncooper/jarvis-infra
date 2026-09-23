#!/bin/bash
# App probe — jarvis.lan orchestrator + glass. No sqlite, no log bodies.
set -euo pipefail
if [ "$(whoami)" != agent ]; then echo FATAL: run as agent >&2; exit 1; fi
APP="${JARVIS_APP:-$HOME/jarvis-app}"

printf '\n========== APP jarvis ==========\n'
date -Is

if [ ! -f "$APP/VERSION" ]; then
  echo "FATAL: jarvis-app VERSION MISS $APP" >&2
  exit 1
fi
# shellcheck disable=SC1091
. "$APP/VERSION"
ORCH_WANT="${IMAGE_ORCHESTRATOR}:${IMAGE_ORCHESTRATOR_TAG}"
GLASS_WANT="${IMAGE_GLASS}:${IMAGE_GLASS_TAG}"
echo "orch_pin=$ORCH_WANT"
echo "glass_pin=$GLASS_WANT theme=$JARVIS_THEME"

echo
echo "--- deploys ---"
kubectl -n apps get deploy jarvis-orchestrator jarvis-glass -o json \
  | ORCH="$ORCH_WANT" GLASS="$GLASS_WANT" python3 -c '
import json, os, sys
d = json.load(sys.stdin)
want = {"jarvis-orchestrator": os.environ["ORCH"], "jarvis-glass": os.environ["GLASS"]}
for it in d.get("items", []):
    name = it["metadata"]["name"]
    spec = it["spec"]["template"]["spec"]
    c = spec["containers"][0]
    img = c.get("image")
    mounts = sorted(m.get("mountPath") for m in (c.get("volumeMounts") or []))
    print(name)
    print("  image", img)
    print("  policy", c.get("imagePullPolicy"))
    print("  sa", spec.get("serviceAccountName"))
    print("  nodesel", spec.get("nodeSelector"))
    print("  mounts", mounts)
    print("  PIN_MATCH", img == want.get(name))
'
kubectl -n apps get pod -l "app in (jarvis-orchestrator,jarvis-glass)" -o wide --no-headers

echo
echo "--- https://jarvis.lan/health (flags only) ---"
python3 - << 'PY'
import json, ssl, urllib.request
ctx = ssl._create_unverified_context()
url = "https://jarvis.lan/health"
try:
    with urllib.request.urlopen(url, timeout=10, context=ctx) as r:
        d = json.loads(r.read().decode())
    keep = ("ok", "service", "version", "degraded", "reason", "llm", "stt", "tts", "hands", "mock", "memory_facts")
    for k in keep:
        if k in d:
            print(k, d[k])
except Exception as e:
    print("FAIL", type(e).__name__)
PY

echo
echo "--- noc.lan (code only) ---"
code=$(curl -sk -o /dev/null -w '%{http_code}' --connect-timeout 5 --max-time 15 https://noc.lan/ || echo FAIL)
echo "https://noc.lan/ -> $code"

echo
echo "========== DONE APP jarvis =========="
echo "DISCOVER_OK app=jarvis"
