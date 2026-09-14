#!/bin/bash
# Run on bastion as agent. Nightly NFS backup of etcd + hostPath state.
set -euo pipefail
STAMP=$(date +%Y%m%d-%H%M)
REMOTE=data-01
ROOT=/cluster/nfs/backups
KEEP_DAYS=7

ssh -o BatchMode=yes "$REMOTE" "sudo mkdir -p $ROOT/$STAMP && sudo chmod 750 $ROOT $ROOT/$STAMP"

echo "== etcd snapshot =="
ssh -o BatchMode=yes ctrl-01 'sudo k3s etcd-snapshot save' || true

echo "== hostPaths =="
ssh -o BatchMode=yes ctrl-01 "sudo tar -C /cluster/local -czf - gitea" \
  | ssh -o BatchMode=yes "$REMOTE" "sudo tee $ROOT/$STAMP/gitea.tgz >/dev/null"
ssh -o BatchMode=yes apps-01 "sudo tar -C /cluster/local -czf - open-webui openclaw" \
  | ssh -o BatchMode=yes "$REMOTE" "sudo tee $ROOT/$STAMP/apps-local.tgz >/dev/null"
ssh -o BatchMode=yes data-02 "sudo tar -C /cluster/local -czf - grafana" \
  | ssh -o BatchMode=yes "$REMOTE" "sudo tee $ROOT/$STAMP/grafana.tgz >/dev/null"

echo "== bastion secrets (mode 600) =="
tar -C "$HOME" -czf - \
  --ignore-failed-read \
  .litellm-master.key .grafana-admin .gitea-flux.token .kube/config \
  | ssh -o BatchMode=yes "$REMOTE" "sudo tee $ROOT/$STAMP/bastion-secrets.tgz >/dev/null"
ssh -o BatchMode=yes "$REMOTE" "sudo chmod 600 $ROOT/$STAMP/bastion-secrets.tgz"

echo "== prune > ${KEEP_DAYS}d =="
ssh -o BatchMode=yes "$REMOTE" "sudo find $ROOT -mindepth 1 -maxdepth 1 -type d -mtime +$KEEP_DAYS -exec rm -rf {} +"

echo "== listing =="
ssh -o BatchMode=yes "$REMOTE" "sudo du -sh $ROOT $ROOT/$STAMP; sudo ls -lh $ROOT/$STAMP"
echo "OK $STAMP"
