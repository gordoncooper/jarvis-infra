#!/bin/bash
set -euo pipefail
if [ "$(whoami)" != agent ]; then echo FATAL: run as agent >&2; exit 1; fi
# Spine is docs/persona.txt. Bake SYSTEM so Qwen does not inherit You are Qwen.
# Override: PROMPT_FILE=... BAKE_SYSTEM=0 ./scripts/create-jarvis-ollama.sh
ROOT=$(cd "$(dirname "$0")/.." && pwd)
PROMPT_FILE="${1:-$ROOT/docs/persona.txt}"
BAKE_SYSTEM="${BAKE_SYSTEM:-1}"
BASE=qwen2.5:7b-instruct-q6_K
SYS=""
if [ "$BAKE_SYSTEM" = 1 ]; then SYS=$(cat "$PROMPT_FILE"); fi
MF=$(mktemp)
trap 'rm -f "$MF"' EXIT
python3 - "$MF" "$BASE" "$SYS" << 'INNER'
import sys
from pathlib import Path
mf, base, sys_txt = sys.argv[1], sys.argv[2], sys.argv[3]
if '"""' in sys_txt:
    raise SystemExit("SYSTEM contains triple-quote")
tmpl = "{{ if .System }}<|im_start|>system\n{{ .System }}<|im_end|>\n{{ end }}{{ range .Messages }}<|im_start|>{{ .Role }}\n{{ .Content }}<|im_end|>\n{{ end }}<|im_start|>assistant\n"
parts = ["FROM " + base + "\n", 'TEMPLATE """' + tmpl + '"""\n']
if sys_txt.strip():
    parts.append('SYSTEM """' + sys_txt + '"""\n')
parts += [
    'PARAMETER stop "How can I assist"\n',
    'PARAMETER stop "How can I help you"\n',
    'PARAMETER stop "What can I help you with"\n',
    'PARAMETER stop "Is there anything else"\n',
    'PARAMETER stop "Would you like"\n',
]
Path(mf).write_text("".join(parts))
print("Modelfile bytes", Path(mf).stat().st_size, "bake_system", bool(sys_txt.strip()))
INNER
kubectl -n inference rollout status deploy/ollama --timeout=180s
kubectl -n inference exec deploy/ollama -- ollama pull "$BASE"
kubectl -n inference exec -i deploy/ollama -- tee /tmp/Modelfile >/dev/null < "$MF"
kubectl -n inference exec deploy/ollama -- ollama create jarvis -f /tmp/Modelfile
kubectl -n inference exec deploy/ollama -- ollama list
