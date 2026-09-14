#!/bin/bash
set -euo pipefail
GH="${JARVIS_GH_CLUSTER:-git@github.com:gordoncooper/jarvis-cluster.git}"
WORKDIR="${HOME}/.jarvis-mirror/cluster.git"
TOKEN_FILE="${HOME}/.gitea-flux.token"
export GIT_TERMINAL_PROMPT=0
if [ ! -f "$TOKEN_FILE" ]; then
  echo "missing $TOKEN_FILE" >&2
  exit 1
fi
TOKEN=$(tr -d '\n' < "$TOKEN_FILE")
GITEA_URL="http://jarvis:${TOKEN}@git.lan/jarvis/cluster.git"
mkdir -p "$(dirname "$WORKDIR")"
if [ ! -d "$WORKDIR" ]; then
  git clone --mirror "$GITEA_URL" "$WORKDIR"
else
  git -C "$WORKDIR" remote set-url origin "$GITEA_URL"
  git -C "$WORKDIR" fetch --prune origin
fi
git -C "$WORKDIR" remote get-url github >/dev/null 2>&1 || git -C "$WORKDIR" remote add github "$GH"
git -C "$WORKDIR" remote set-url github "$GH"
git -C "$WORKDIR" push --mirror github
echo "mirrored to $GH"
