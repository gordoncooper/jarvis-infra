#!/bin/bash
# Run on bastion as agent. Nightly NFS backup of etcd + hostPath state.
# Do not add /cluster/nfs/models, Piper voices, or Prometheus. Those are
# pulled or grown again. etcd snapshots stay mode 600; they hold cluster secrets.
set -euo pipefail
STAMP=$(date +%Y%m%d-%H%M)
REMOTE=data-01
ROOT=/cluster/nfs/backups
KEEP_DAYS=7
ONDEMAND_KEEP=8
fail=0

mark() { echo "FAIL $*"; fail=1; }

ssh -n -o BatchMode=yes "$REMOTE" "sudo mkdir -p $ROOT/$STAMP && sudo chmod 750 $ROOT $ROOT/$STAMP"

echo "== etcd snapshot =="
before=$(ssh -n -o BatchMode=yes ctrl-01 "sudo sh -c 'ls -1t /mnt/nfs/snapshots/on-demand-* 2>/dev/null | head -1'" || true)
if ssh -n -o BatchMode=yes ctrl-01 'sudo k3s etcd-snapshot save --config /etc/rancher/k3s/snapshot.yaml'; then
  after=$(ssh -n -o BatchMode=yes ctrl-01 "sudo sh -c 'ls -1t /mnt/nfs/snapshots/on-demand-* 2>/dev/null | head -1'" || true)
  if [ -n "$after" ] && [ "$after" != "$before" ]; then
    base=$(basename "$after")
    if ! ssh -n -o BatchMode=yes "$REMOTE" "sudo cp /cluster/nfs/snapshots/$base $ROOT/$STAMP/$base && sudo chmod 600 $ROOT/$STAMP/$base"; then
      mark "copy etcd snapshot into stamp"
    fi
  else
    mark "etcd snapshot did not produce a new file"
  fi
else
  mark "etcd snapshot save"
fi

echo "== prune on-demand etcd (keep ${ONDEMAND_KEEP}; never touch etcd-snapshot-*) =="
ssh -n -o BatchMode=yes ctrl-01 "sudo sh -c 'ls -1t /mnt/nfs/snapshots/on-demand-* 2>/dev/null | tail -n +$((ONDEMAND_KEEP + 1)) | xargs -r rm -f'"

echo "== hostPaths =="
# Producer ssh -n (do not steal stdin). Consumer ssh MUST read the pipe — no -n.
if ! ssh -n -o BatchMode=yes ctrl-01 "sudo tar -C /cluster/local -czf - gitea" \
  | ssh -o BatchMode=yes "$REMOTE" "sudo tee $ROOT/$STAMP/gitea.tgz >/dev/null"; then
  mark "gitea"
fi
if ! ssh -n -o BatchMode=yes apps-01 "sudo tar -C /cluster/local -czf - open-webui openclaw" \
  | ssh -o BatchMode=yes "$REMOTE" "sudo tee $ROOT/$STAMP/apps-local.tgz >/dev/null"; then
  mark "apps-local"
fi
if ! ssh -n -o BatchMode=yes data-02 "sudo tar -C /cluster/local -czf - grafana" \
  | ssh -o BatchMode=yes "$REMOTE" "sudo tee $ROOT/$STAMP/grafana.tgz >/dev/null"; then
  mark "grafana"
fi

echo "== bastion secrets (mode 600) =="
# Node SSH keys are id_ed25519 and id_rsa. id_ed25519_github is the GitHub key only.
if ! tar -C "$HOME" -czf - \
  .litellm-master.key .grafana-admin .gitea-flux.token .gitea-admin.pass \
  .xai-api.key .openclaw-gateway.token .kube/config \
  .config/sops/age/keys.txt \
  .ssh/id_ed25519_github .ssh/id_ed25519 .ssh/id_rsa \
  .config/goose \
  | ssh -o BatchMode=yes "$REMOTE" "sudo tee $ROOT/$STAMP/bastion-secrets.tgz >/dev/null"; then
  mark "bastion-secrets"
fi
ssh -n -o BatchMode=yes "$REMOTE" "sudo chmod 600 $ROOT/$STAMP/bastion-secrets.tgz" || mark "chmod bastion-secrets"

echo "== jarvis nfs (sqlite, learned.md, files) =="
# Whole directory. Not gated on learned.md. Not /cluster/nfs/models.
if ! ssh -n -o BatchMode=yes "$REMOTE" "sudo test -d /cluster/nfs/jarvis"; then
  mark "nfs jarvis dir missing"
else
  # sqlite can return EAGAIN while the orchestrator holds it. Retry the read.
  jarvis_ok=0
  for _try in 1 2 3 4 5; do
    if ssh -n -o BatchMode=yes "$REMOTE" "sudo tar -C /cluster/nfs -czf - jarvis" \
      | ssh -o BatchMode=yes "$REMOTE" "sudo tee $ROOT/$STAMP/jarvis-learned.tgz >/dev/null"; then
      jarvis_ok=1
      break
    fi
    echo "WARN jarvis tar attempt $_try"
    sleep 2
  done
  [ "$jarvis_ok" = 1 ] || mark "jarvis"
fi

echo "== github mirror (best-effort) =="
"$HOME/jarvis-infra/scripts/mirror-to-github.sh" || echo "WARN: github mirror failed"

echo "== prune hostPath > ${KEEP_DAYS}d =="
ssh -n -o BatchMode=yes "$REMOTE" "sudo find $ROOT -mindepth 1 -maxdepth 1 -type d -mtime +$KEEP_DAYS -exec rm -rf {} +"

echo "== stamp complete? =="
if ! ssh -n -o BatchMode=yes "$REMOTE" "sudo sh -c 'cd $ROOT/$STAMP && ok=1
for f in gitea.tgz apps-local.tgz grafana.tgz bastion-secrets.tgz jarvis-learned.tgz; do
  [ -s \"\$f\" ] && tar -tzf \"\$f\" >/dev/null || { echo BAD \"\$f\"; ok=0; }
done
set -- on-demand-ctrl-01-*
if [ ! -s \"\$1\" ]; then echo MISSING etcd snapshot; ok=0; fi
[ \"\$ok\" = 1 ]'"; then
  mark "stamp incomplete"
fi

echo "== listing =="
# Publish a status document where JARVIS can read it (D-0037).
#
# The backups directory stays 0750 root. Rather than loosen that so a service
# can stat it, the producer writes what it already knows onto the NFS share
# the orchestrator already mounts. `backup.latest` reads this and nothing
# else, so answering "when did the last backup run?" costs no access to the
# archives themselves.
#
# stdin IS the remote program here, so no -n (see LESSONS on ssh and stdin).
if [ "$fail" -eq 0 ]; then BACKUP_OK=1; else BACKUP_OK=0; fi
ssh -o BatchMode=yes "$REMOTE" "sudo STAMP=$STAMP ROOT=$ROOT BACKUP_OK=$BACKUP_OK python3 -" <<'PUBLISH' || mark "could not publish backup-status.json"
import json, os, pathlib, time
stamp = os.environ["STAMP"]
root = pathlib.Path(os.environ["ROOT"]) / stamp
files = (
    sorted(
        ({"name": f.name, "bytes": f.stat().st_size} for f in root.iterdir() if f.is_file()),
        key=lambda x: x["name"],
    )
    if root.is_dir()
    else []
)
out = {
    "stamp": stamp,
    "finished_at": time.time(),
    "total_bytes": sum(f["bytes"] for f in files),
    "ok": os.environ.get("BACKUP_OK") == "1",
    "files": files,
}
dest = pathlib.Path("/cluster/nfs/jarvis/backup-status.json")
dest.write_text(json.dumps(out, indent=2) + "\n")
dest.chmod(0o644)
print("published", dest, out["stamp"], out["ok"], out["total_bytes"], "bytes")
PUBLISH

ssh -n -o BatchMode=yes "$REMOTE" "sudo du -sh $ROOT $ROOT/$STAMP; sudo ls -lh $ROOT/$STAMP"
if [ "$fail" -ne 0 ]; then
  echo "FAIL $STAMP"
  exit 1
fi
echo "OK $STAMP"
