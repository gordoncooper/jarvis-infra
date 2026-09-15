#!/bin/bash
set -euo pipefail
if [ "$(whoami)" != agent ]; then echo FATAL: run as agent >&2; exit 1; fi
ROOT=$(cd "$(dirname "$0")/.." && pwd)
OUT="$HOME/.config/goose/context.md"
mkdir -p "$HOME/.config/goose"
{
  cat "$ROOT/docs/briefing.md"
  echo
  echo '---'
  echo
  ssh -n -o BatchMode=yes apps-01 'sudo cat /cluster/local/openclaw/learned.md' 2>/dev/null \
    || ssh -n -o BatchMode=yes data-01 'sudo cat /cluster/nfs/jarvis/learned.md'
} > "$OUT"
chmod 644 "$OUT"
echo "goose context $OUT bytes $(wc -c < "$OUT")"
