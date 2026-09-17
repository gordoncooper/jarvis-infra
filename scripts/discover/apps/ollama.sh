#!/bin/bash
# App probe — Ollama chat (gpu-01) + embed (gpu-02). Names/sizes/VRAM only.
set -euo pipefail
if [ "$(whoami)" != agent ]; then echo FATAL: run as agent >&2; exit 1; fi

printf '\n========== APP ollama ==========\n'
date -Is

echo
echo "--- deploys ---"
kubectl -n inference get deploy -l "app in (ollama,ollama-embed)" -o json | python3 -c '
import json,sys
d=json.load(sys.stdin)
for it in d.get("items",[]):
    spec=it["spec"]["template"]["spec"]
    c=spec["containers"][0]
    print(it["metadata"]["name"], "image", c.get("image"), "policy", c.get("imagePullPolicy"),
          "sa", spec.get("serviceAccountName"), "nodesel", spec.get("nodeSelector"),
          "gpu_lim", (c.get("resources") or {}).get("limits"))
'
kubectl -n inference get pod -l "app in (ollama,ollama-embed)" -o wide --no-headers

echo
echo "--- GPU VRAM ---"
for h in gpu-01 gpu-02; do
  echo "===== $h ====="
  ssh -n -o BatchMode=yes "$h" 'nvidia-smi --query-gpu=name,memory.used,memory.total,utilization.gpu --format=csv,noheader' || echo SSH_FAIL
done

echo
echo "--- ollama list ---"
for app in ollama ollama-embed; do
  pod=$(kubectl -n inference get pod -l app="$app" -o jsonpath="{.items[0].metadata.name}" 2>/dev/null || true)
  echo "===== $app pod=$pod ====="
  if [ -n "$pod" ]; then
    kubectl -n inference exec "$pod" -- ollama list || echo LIST_FAIL
  fi
done

echo
echo "========== DONE APP ollama =========="
echo "DISCOVER_OK app=ollama no grok ping"
