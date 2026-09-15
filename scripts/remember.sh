#!/bin/bash
set -euo pipefail
if [ "$(whoami)" != agent ]; then echo FATAL: run as agent >&2; exit 1; fi
ROOT=$(cd "$(dirname "$0")/.." && pwd)
FACT=$(printf '%s' "$*" | tr '\n' ' ' | sed 's/[[:space:]]\+$//')
if [ -z "$FACT" ]; then
  echo "usage: $0 <fact>" >&2
  exit 2
fi
echo "$FACT" | grep -qiE 'password|api[_-]?key|token:|age1|BEGIN |sk-' && {
  echo "FATAL: looks like a secret — not writing learned.md" >&2
  exit 3
}
LINE="- $(date -Is) $FACT"
ssh -o BatchMode=yes apps-01 "sudo tee -a /cluster/local/openclaw/learned.md >/dev/null && sudo chmod 666 /cluster/local/openclaw/learned.md" <<< "$LINE"
echo "appended: $LINE"
bash "$ROOT/scripts/seed-learned.sh"
