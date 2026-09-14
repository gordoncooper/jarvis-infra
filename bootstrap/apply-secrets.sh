#!/bin/bash
# Create k8s secrets from a decrypted YAML or from bastion files.
# Usage: apply-secrets.sh [secrets.yaml]
set -euo pipefail
need() { kubectl get ns "$1" >/dev/null 2>&1 || kubectl create ns "$1"; }

if [ -n "${1:-}" ]; then
  eval "$(python3 - "$1" << 'PY'
import sys, yaml
d = yaml.safe_load(open(sys.argv[1]))
for k, v in d.items():
    if v is None: continue
    print(f"export JARVIS_{k.upper()}={v!r}")
PY
)"
else
  export JARVIS_LITELLM_MASTER_KEY="$(cat ~/.litellm-master.key 2>/dev/null || true)"
  export JARVIS_XAI_API_KEY="$(cat ~/.xai-api.key 2>/dev/null || true)"
  export JARVIS_GRAFANA_ADMIN_PASSWORD="$(cat ~/.grafana-admin 2>/dev/null || true)"
  export JARVIS_OPENCLAW_GATEWAY_TOKEN="$(cat ~/.openclaw-gateway.token 2>/dev/null || true)"
  export JARVIS_OPENCLAW_LITELLM_KEY="${JARVIS_LITELLM_MASTER_KEY}"
fi

need inference
if [ -n "${JARVIS_LITELLM_MASTER_KEY:-}" ]; then
  kubectl -n inference create secret generic litellm \
    --from-literal=LITELLM_MASTER_KEY="$JARVIS_LITELLM_MASTER_KEY" \
    --from-literal=XAI_API_KEY="${JARVIS_XAI_API_KEY:-}" \
    --dry-run=client -o yaml | kubectl apply -f -
  echo "litellm secret ok"
  need apps
  if kubectl -n apps get secret open-webui >/dev/null 2>&1; then
    echo "open-webui secret exists (left alone)"
  else
    kubectl -n apps create secret generic open-webui \
      --from-literal=OPENAI_API_KEY="$JARVIS_LITELLM_MASTER_KEY" \
      --from-literal=WEBUI_SECRET_KEY="$(python3 -c 'import secrets; print(secrets.token_hex(32))')"
    echo "open-webui secret created"
  fi
fi

need monitoring
if [ -n "${JARVIS_GRAFANA_ADMIN_PASSWORD:-}" ]; then
  kubectl -n monitoring create secret generic grafana \
    --from-literal=admin-password="$JARVIS_GRAFANA_ADMIN_PASSWORD" \
    --dry-run=client -o yaml | kubectl apply -f -
  echo "grafana secret ok"
fi

need agents
if [ -n "${JARVIS_OPENCLAW_GATEWAY_TOKEN:-}" ]; then
  kubectl -n agents create secret generic openclaw \
    --from-literal=GATEWAY_TOKEN="$JARVIS_OPENCLAW_GATEWAY_TOKEN" \
    --from-literal=LITELLM_MASTER_KEY="${JARVIS_OPENCLAW_LITELLM_KEY:-$JARVIS_LITELLM_MASTER_KEY}" \
    --dry-run=client -o yaml | kubectl apply -f -
  echo "openclaw secret ok"
fi
