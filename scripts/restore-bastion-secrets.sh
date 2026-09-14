#!/bin/bash
set -euo pipefail
STAMP="${1:?usage: restore-bastion-secrets.sh YYYYMMDD-HHMM}"
ssh data-01 "sudo cat /cluster/nfs/backups/$STAMP/bastion-secrets.tgz" > /tmp/bastion-secrets.tgz
cd "$HOME"
if [ "${FORCE:-0}" = 1 ]; then tar -xzf /tmp/bastion-secrets.tgz
else tar -k -xzf /tmp/bastion-secrets.tgz || true
fi
chmod 600 .litellm-master.key .grafana-admin .gitea-flux.token .xai-api.key \
  .openclaw-gateway.token .config/sops/age/keys.txt .ssh/id_ed25519_github \
  .config/goose/secrets.yaml 2>/dev/null || true
echo "unpacked $STAMP"
ls -ld .config/goose
