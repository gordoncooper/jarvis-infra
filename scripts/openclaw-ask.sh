#!/bin/bash
# One OpenClaw agent turn via the in-cluster CLI (gateway on :18789).
# Does not nest Goose. Chat.lan never calls this automatically.
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
# Pass message as argv to avoid shell injection into the pod.
kubectl -n agents exec "$POD" -- \
  openclaw agent --message "$MSG" --timeout "$TIMEOUT" --json
