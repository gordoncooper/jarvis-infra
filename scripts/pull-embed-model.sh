#!/bin/bash
# Pull nomic-embed-text into ollama-embed on gpu-02.
set -euo pipefail
kubectl -n inference rollout status deploy/ollama-embed --timeout=180s
kubectl -n inference exec deploy/ollama-embed -- ollama pull nomic-embed-text
kubectl -n inference exec deploy/ollama-embed -- ollama list
ssh gpu-02 nvidia-smi --query-gpu=memory.used,memory.total --format=csv
