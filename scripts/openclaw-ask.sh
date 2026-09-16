#!/bin/bash
# One OpenClaw agent turn. Default: assistant text only.
# Full JSON: OPENCLAW_ASK_JSON=1 ./scripts/openclaw-ask.sh "…"
set -euo pipefail
if [ "$(whoami)" != agent ]; then echo "FATAL: run as agent" >&2; exit 1; fi
MSG=${1:-}
if [ -z "$MSG" ]; then
  echo "usage: $0 \"message\"" >&2
  exit 2
fi
TIMEOUT=${OPENCLAW_ASK_TIMEOUT:-120}
POD=$(kubectl -n agents get pod -l app=openclaw -o jsonpath='{.items[0].metadata.name}')
if [ -z "$POD" ]; then echo "FATAL: no openclaw pod" >&2; exit 1; fi
RAW=$(kubectl -n agents exec "$POD" -- \
  openclaw agent --message "$MSG" --timeout "$TIMEOUT" --json)
if [ "${OPENCLAW_ASK_JSON:-}" = 1 ]; then
  printf '%s\n' "$RAW"
  exit 0
fi
printf '%s\n' "$RAW" | python3 -c '
import json, sys
raw = sys.stdin.read()
try:
    d = json.loads(raw)
except Exception:
    sys.stdout.write(raw[:2000]); sys.exit(1)
status = d.get("status")
print("status", status or "?")
res = d.get("result") or {}
texts = []
for p in res.get("payloads") or []:
    t = (p or {}).get("text")
    if t:
        texts.append(t)
vis = (res.get("meta") or {}).get("finalAssistantVisibleText")
if vis and vis not in texts:
    texts.append(vis)
print((texts[-1] if texts else raw[:1500]).rstrip())
'
