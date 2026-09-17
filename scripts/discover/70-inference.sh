#!/bin/bash
# Layer 70 — inference. Model names + VRAM. No API keys printed. No Grok calls.
set -euo pipefail
if [ "$(whoami)" != agent ]; then echo FATAL: run as agent >&2; exit 1; fi

printf '\n========== 70-INFERENCE ==========\n'
date -Is

echo
echo "--- ollama pods ---"
kubectl -n inference get deploy,pod -o wide --no-headers 2>/dev/null || echo "inference MISS"

echo
echo "--- GPU VRAM (nvidia-smi csv) ---"
for h in gpu-01 gpu-02; do
  echo "===== $h ====="
  ssh -n -o BatchMode=yes -o ConnectTimeout=8 "$h" \
    'nvidia-smi --query-gpu=name,memory.used,memory.total,utilization.gpu --format=csv,noheader' \
    2>/dev/null || echo "nvidia-smi MISS"
done

echo
echo "--- ollama list (names/size only) ---"
for deploy in ollama ollama-embed; do
  echo "===== $deploy ====="
  POD=$(kubectl -n inference get pod -l app="$deploy" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || true)
  if [ -z "$POD" ]; then echo "pod MISS"; continue; fi
  echo "pod=$POD"
  kubectl -n inference exec "$POD" -- ollama list 2>/dev/null || echo "ollama list FAIL"
done

echo
echo "--- LiteLLM /v1/models (ids only) ---"
if [ -f "$HOME/.litellm-master.key" ]; then
  KEY=$(cat "$HOME/.litellm-master.key")
  python3 - "$KEY" << 'PY'
import json,sys,urllib.request
key=sys.argv[1]
req=urllib.request.Request(
    "https://llm.lan/v1/models",
    headers={"Authorization":"Bearer "+key},
)
try:
    with urllib.request.urlopen(req, timeout=15) as r:
        d=json.loads(r.read().decode())
    ids=sorted(x.get("id","") for x in d.get("data") or [])
    print("count", len(ids))
    for i in ids:
        print(i)
except Exception as e:
    print("models FAIL", type(e).__name__)
PY
  unset KEY
else
  echo "litellm key file MISS"
fi

echo
echo "--- LiteLLM config model_name list (from live ConfigMap, no keys) ---"
kubectl -n inference get configmap litellm-config -o jsonpath='{.data.config\.yaml}' 2>/dev/null | python3 -c '
import sys
try:
    import yaml
except ImportError:
    yaml=None
text=sys.stdin.read()
if not text:
    print("configmap MISS"); sys.exit(0)
if yaml:
    d=yaml.safe_load(text) or {}
    for m in d.get("model_list") or []:
        name=m.get("model_name")
        params=(m.get("litellm_params") or {})
        model=params.get("model")
        print("model_name", name, "->", model)
    ar=d.get("auto_router") or d.get("router_settings") or {}
    print("top_keys", sorted(d.keys()))
else:
    for line in text.splitlines():
        s=line.strip()
        if s.startswith("model_name:") or s.startswith("model:") or s.startswith("- model_name"):
            if "api_key" in s.lower() or "key:" in s.lower():
                continue
            print(s)
'

echo
echo "========== DONE 70-INFERENCE =========="
echo "DISCOVER_OK layer=inference no keys no grok ping"
