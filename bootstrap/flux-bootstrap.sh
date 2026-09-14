#!/bin/bash
set -euo pipefail
TOKEN=$(tr -d '\n' < ~/.gitea-flux.token)
export GIT_TERMINAL_PROMPT=0
command -v flux >/dev/null || curl -sS https://fluxcd.io/install.sh | sudo bash
flux bootstrap git \
  --url=http://git.lan/jarvis/cluster.git \
  --branch=main --path=clusters/jarvis \
  --username=jarvis --password="$TOKEN"
flux get kustomizations
