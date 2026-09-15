#!/bin/bash
# Run on bastion as agent. Nightly NFS backup of etcd + hostPath state.
set -euo pipefail
STAMP=$(date +%Y%m%d-%H%M)
REMOTE=data-01
ROOT=/cluster/nfs/backups
KEEP_DAYS=7
ONDEMAND_KEEP=8

ssh -n -o BatchMode=yes "$REMOTE" "sudo mkdir -p $ROOT/$STAMP && sudo chmod 750 $ROOT $ROOT/$STAMP"

echo "== etcd snapshot =="
ssh -n -o BatchMode=yes ctrl-01 'sudo k3s etcd-snapshot save --config /etc/rancher/k3s/snapshot.yaml' || true

echo "== prune on-demand etcd (keep ${ONDEMAND_KEEP}; never touch etcd-snapshot-*) =="
ssh -n -o BatchMode=yes ctrl-01 "sudo sh -c 'ls -1t /mnt/nfs/snapshots/on-demand-* 2>/dev/null | tail -n +$((ONDEMAND_KEEP + 1)) | xargs -r rm -f'"

echo "== hostPaths =="
ssh -n -o BatchMode=yes ctrl-01 "sudo tar -C /cluster/local -czf - gitea" \
  | ssh -n -o BatchMode=yes "$REMOTE" "sudo tee $ROOT/$STAMP/gitea.tgz >/dev/null"
ssh -n -o BatchMode=yes apps-01 "sudo tar -C /cluster/local -czf - open-webui openclaw" \
  | ssh -n -o BatchMode=yes "$REMOTE" "sudo tee $ROOT/$STAMP/apps-local.tgz >/dev/null"
ssh -n -o BatchMode=yes data-02 "sudo tar -C /cluster/local -czf - grafana" \
  | ssh -n -o BatchMode=yes "$REMOTE" "sudo tee $ROOT/$STAMP/grafana.tgz >/dev/null"

echo "== bastion secrets (mode 600) =="
tar -C "$HOME" -czf - \
  --ignore-failed-read \
  .litellm-master.key .grafana-admin .gitea-flux.token .gitea-admin.pass \
  .xai-api.key .openclaw-gateway.token .kube/config \
  .config/sops/age/keys.txt .ssh/id_ed25519_github .config/goose \
  | ssh -n -o BatchMode=yes "$REMOTE" "sudo tee $ROOT/$STAMP/bastion-secrets.tgz >/dev/null"
ssh -n -o BatchMode=yes "$REMOTE" "sudo chmod 600 $ROOT/$STAMP/bastion-secrets.tgz"

echo "== learned.md (NFS mirror) =="
ssh -n -o BatchMode=yes "$REMOTE" "sudo test -f /cluster/nfs/jarvis/learned.md && sudo tar -C /cluster/nfs -czf - jarvis" \
  | ssh -n -o BatchMode=yes "$REMOTE" "sudo tee $ROOT/$STAMP/jarvis-learned.tgz >/dev/null" || echo "WARN: no nfs jarvis dir"

echo "== github mirror (best-effort) =="
"$HOME/jarvis-infra/scripts/mirror-to-github.sh" || echo "WARN: github mirror failed"

echo "== prune hostPath > ${KEEP_DAYS}d =="
ssh -n -o BatchMode=yes "$REMOTE" "sudo find $ROOT -mindepth 1 -maxdepth 1 -type d -mtime +$KEEP_DAYS -exec rm -rf {} +"

echo "== listing =="
ssh -n -o BatchMode=yes "$REMOTE" "sudo du -sh $ROOT $ROOT/$STAMP; sudo ls -lh $ROOT/$STAMP"
echo "OK $STAMP"
