#!/bin/bash
set -euo pipefail
PROMPT_FILE="${1:-$HOME/cluster/clusters/jarvis/apps/jarvis-system-prompt.txt}"
BASE=qwen2.5:7b-instruct-q6_K
SYS=$( [ -s "$PROMPT_FILE" ] && cat "$PROMPT_FILE" || echo "You are JARVIS." )
kubectl -n inference rollout status deploy/ollama --timeout=180s
kubectl -n inference exec deploy/ollama -- ollama pull "$BASE"
kubectl -n inference exec -i deploy/ollama -- sh -c 'cat > /tmp/Modelfile && ollama create jarvis -f /tmp/Modelfile && ollama list' << EOF2
FROM ${BASE}
SYSTEM """${SYS}"""
EOF2
