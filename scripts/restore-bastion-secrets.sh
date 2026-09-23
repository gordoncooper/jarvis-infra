#!/bin/bash
set -euo pipefail
STAMP="${1:?usage: restore-bastion-secrets.sh YYYYMMDD-HHMM}"
ssh -n -o BatchMode=yes data-01 "sudo cat /cluster/nfs/backups/$STAMP/bastion-secrets.tgz" > /tmp/bastion-secrets.tgz
cd "$HOME"
if [ "${FORCE:-0}" = 1 ]; then tar -xzf /tmp/bastion-secrets.tgz
else tar -k -xzf /tmp/bastion-secrets.tgz || true
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
  .config/goose/secrets.yaml \
  2>/dev/null || true
echo "unpacked $STAMP"
ls -ld .config/goose .config/sops/age .kube 2>/dev/null || true
