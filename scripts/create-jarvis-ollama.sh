#!/bin/bash
# Recreate Ollama model `jarvis` after a wipe. Idempotent.
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/.." && pwd)
kubectl -n inference exec -i deploy/ollama -- sh -s << EOF
cat > /tmp/Modelfile << 'MF'
$(cat "$ROOT/k8s/inference/Modelfile")
MF
ollama create jarvis -f /tmp/Modelfile
ollama list
EOF
