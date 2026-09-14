#!/bin/bash
# Bastion: push Gitea (authoritative) to GitHub (mirror). Requires gh auth.
set -euo pipefail
GH="${JARVIS_GH_CLUSTER:-git@github.com:gordoncooper/jarvis-cluster.git}"
WORKDIR="${HOME}/.jarvis-mirror/cluster.git"
mkdir -p "$(dirname "$WORKDIR")"
if [ ! -d "$WORKDIR" ]; then
  git clone --mirror http://git.lan/jarvis/cluster.git "$WORKDIR"
else
  git -C "$WORKDIR" fetch --prune origin
fi
git -C "$WORKDIR" remote get-url github 2>/dev/null || git -C "$WORKDIR" remote add github "$GH"
git -C "$WORKDIR" remote set-url github "$GH"
git -C "$WORKDIR" push --mirror github
echo "mirrored to $GH"
