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
# Producer ssh -n (do not steal stdin). Consumer ssh MUST read the pipe — no -n.
ssh -n -o BatchMode=yes ctrl-01 "sudo tar -C /cluster/local -czf - gitea" \
  | ssh -o BatchMode=yes "$REMOTE" "sudo tee $ROOT/$STAMP/gitea.tgz >/dev/null"
ssh -n -o BatchMode=yes apps-01 "sudo tar -C /cluster/local -czf - open-webui openclaw" \
  | ssh -o BatchMode=yes "$REMOTE" "sudo tee $ROOT/$STAMP/apps-local.tgz >/dev/null"
ssh -n -o BatchMode=yes data-02 "sudo tar -C /cluster/local -czf - grafana" \
  | ssh -o BatchMode=yes "$REMOTE" "sudo tee $ROOT/$STAMP/grafana.tgz >/dev/null"

echo "== bastion secrets (mode 600) =="
tar -C "$HOME" -czf - \
  --ignore-failed-read \
  .litellm-master.key .grafana-admin .gitea-flux.token .gitea-admin.pass \
  .xai-api.key .openclaw-gateway.token .kube/config \
  .config/sops/age/keys.txt .ssh/id_ed25519_github .config/goose \
  | ssh -o BatchMode=yes "$REMOTE" "sudo tee $ROOT/$STAMP/bastion-secrets.tgz >/dev/null"
ssh -n -o BatchMode=yes "$REMOTE" "sudo chmod 600 $ROOT/$STAMP/bastion-secrets.tgz"

echo "== learned.md (NFS mirror) =="
ssh -n -o BatchMode=yes "$REMOTE" "sudo test -f /cluster/nfs/jarvis/learned.md && sudo tar -C /cluster/nfs -czf - jarvis" \
  | ssh -o BatchMode=yes "$REMOTE" "sudo tee $ROOT/$STAMP/jarvis-learned.tgz >/dev/null" || echo "WARN: no nfs jarvis dir"

echo "== github mirror (best-effort) =="
"$HOME/jarvis-infra/scripts/mirror-to-github.sh" || echo "WARN: github mirror failed"

echo "== prune hostPath > ${KEEP_DAYS}d =="
ssh -n -o BatchMode=yes "$REMOTE" "sudo find $ROOT -mindepth 1 -maxdepth 1 -type d -mtime +$KEEP_DAYS -exec rm -rf {} +"

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
ssh -o BatchMode=yes "$REMOTE" "sudo STAMP=$STAMP ROOT=$ROOT python3 -" <<'PUBLISH' || echo "WARN: could not publish backup-status.json"
import json, os, pathlib, time
stamp = os.environ["STAMP"]
root = pathlib.Path(os.environ["ROOT"]) / stamp
files = (
    sorted(
        ({"name": f.name, "bytes": f.stat().st_size} for f in root.glob("*.tgz")),
        key=lambda x: x["name"],
    )
    if root.is_dir()
    else []
)
out = {
    "stamp": stamp,
    "finished_at": time.time(),
    "total_bytes": sum(f["bytes"] for f in files),
    "ok": bool(files),
    "files": files,
}
dest = pathlib.Path("/cluster/nfs/jarvis/backup-status.json")
dest.write_text(json.dumps(out, indent=2) + "\n")
dest.chmod(0o644)
print("published", dest, out["stamp"], out["total_bytes"], "bytes")
PUBLISH

ssh -n -o BatchMode=yes "$REMOTE" "sudo du -sh $ROOT $ROOT/$STAMP; sudo ls -lh $ROOT/$STAMP"
echo "OK $STAMP"
