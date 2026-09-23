#!/bin/bash
# Unpack bastion-secrets.tgz into $HOME. Default keeps files that already exist.
# Wiped HOME only: FORCE=1 overwrites. Do not use FORCE on a healthy bastion.
set -euo pipefail
STAMP="${1:?usage: restore-bastion-secrets.sh YYYYMMDD-HHMM}"
umask 077
tmp=$(mktemp)
trap 'shred -u "$tmp" 2>/dev/null || rm -f "$tmp"' EXIT
ssh -n -o BatchMode=yes data-01 "sudo cat /cluster/nfs/backups/$STAMP/bastion-secrets.tgz" > "$tmp"
cd "$HOME"
if [ "${FORCE:-0}" = 1 ]; then
  tar -xzf "$tmp"
else
  tar -xzf "$tmp" --keep-old-files
fi
chmod 600 \
  .litellm-master.key \
  .grafana-admin \
  .gitea-flux.token \
  .gitea-admin.pass \
  .xai-api.key \
  .openclaw-gateway.token \
  .kube/config \
  .config/sops/age/keys.txt \
  .ssh/id_ed25519_github \
  .ssh/id_ed25519 \
  .ssh/id_rsa \
  .config/goose/secrets.yaml
echo "unpacked $STAMP"
ls -ld .config/goose .config/sops/age .kube
