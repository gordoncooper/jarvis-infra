#!/bin/bash
set -euo pipefail
if [ "$(whoami)" != agent ]; then echo FATAL: run as agent >&2; exit 1; fi
PROMPT_FILE="${1:-$HOME/cluster/clusters/jarvis/apps/jarvis-system-prompt.txt}"
BASE=qwen2.5:7b-instruct-q6_K
SYS=$(cat "$PROMPT_FILE")
MF=$(mktemp)
trap 'rm -f "$MF"' EXIT
python3 - "$MF" "$BASE" "$SYS" << 'INNER'
import sys
from pathlib import Path
mf, base, sys_txt = sys.argv[1], sys.argv[2], sys.argv[3]
if '"""' in sys_txt:
    raise SystemExit("SYSTEM contains triple-quote")
tmpl = "{{ if .System }}<|im_start|>system\n{{ .System }}<|im_end|>\n{{ end }}{{ range .Messages }}<|im_start|>{{ .Role }}\n{{ .Content }}<|im_end|>\n{{ end }}<|im_start|>assistant\n"
Path(mf).write_text(
    "FROM " + base + "\n"
    + 'TEMPLATE """' + tmpl + '"""\n'
    + 'SYSTEM """' + sys_txt + '"""\n'
    + 'PARAMETER stop "How can I assist"\n'
    + 'PARAMETER stop "How can I help you"\n'
    + 'PARAMETER stop "What can I help you with"\n'
    + 'PARAMETER stop "Is there anything else"\n'
    + 'PARAMETER stop "Would you like"\n'
)
print("Modelfile bytes", Path(mf).stat().st_size)
INNER
kubectl -n inference rollout status deploy/ollama --timeout=180s
kubectl -n inference exec deploy/ollama -- ollama pull "$BASE"
kubectl -n inference exec -i deploy/ollama -- tee /tmp/Modelfile >/dev/null < "$MF"
kubectl -n inference exec deploy/ollama -- ollama create jarvis -f /tmp/Modelfile
kubectl -n inference exec deploy/ollama -- ollama list
