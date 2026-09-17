#!/bin/bash
# Who is this process. No secrets. Safe on laptop (prints HANDS=none).
set -euo pipefail
printf '\n========== WHEREAMI ==========\n'
date -Is
echo "whoami=$(whoami)"
echo "HOME=${HOME:-}"
echo "hostname=$(hostname)"
HOST=$(hostname)
USERN=$(whoami)
if [ "$USERN" = agent ] && [ "$HOST" = bastion ]; then
  MODE=bastion-agent
elif [ "$HOST" = bastion ]; then
  MODE=bastion-wrong-user
else
  MODE=not-bastion
fi
echo "MODE=$MODE"
echo "rule: kubeconfig + kubectl = bastion agent only (never a laptop)"

if [ "$MODE" = bastion-agent ]; then
  echo "HANDS=bastion  run discover yourself; edit ~/jarvis-infra and ~/cluster here"
  if command -v kubectl >/dev/null 2>&1; then
    echo -n "kubectl_client "
    kubectl version --client --short 2>/dev/null | head -1 || kubectl version --client 2>/dev/null | head -1
    echo -n "kubectl_context "
    kubectl config current-context 2>/dev/null || echo MISS
    echo -n "kubectl_server "
    kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}' 2>/dev/null; echo
  else
    echo "kubectl MISS"
  fi
else
  echo "HANDS=none  propose quoted heredocs for the operator to run as agent@bastion"
  echo "do not kubectl; do not copy kubeconfig; do not git push cluster to GitHub"
fi

strip() { sed -E 's#://[^/@]+@#://#g'; }
echo "--- remotes (tokens stripped) ---"
if [ -d "${JARVIS_INFRA:-$HOME/jarvis-infra}/.git" ]; then
  echo -n "infra "; git -C "${JARVIS_INFRA:-$HOME/jarvis-infra}" remote -v 2>/dev/null | strip | awk '{print $1,$2,$3}' | sort -u
fi
if [ -d "${JARVIS_CLUSTER:-$HOME/cluster}/.git" ]; then
  echo -n "cluster "; git -C "${JARVIS_CLUSTER:-$HOME/cluster}" remote -v 2>/dev/null | strip | awk '{print $1,$2,$3}' | sort -u
fi
if [ -f "${JARVIS_INFRA:-$HOME/jarvis-infra}/VERSION" ]; then
  grep -E '^(GIT_TAG|IMAGE_TAG|IMAGE|K3S)=' "${JARVIS_INFRA:-$HOME/jarvis-infra}/VERSION"
fi
echo "WHEREAMI_OK"
