# JARVIS restore (after power loss)

Backups: `data-01:/cluster/nfs/backups/YYYYMMDD-HHMM/`  
etcd: `data-01:/cluster/nfs/snapshots/` (also `/mnt/nfs/snapshots` on ctrl-01)

Do **not** restore unless the live cluster is actually dead.

## 1. Confirm backups

```bash
ssh data-01 'sudo ls -lh /cluster/nfs/backups; sudo ls -lh /cluster/nfs/snapshots | tail'
ssh data-01 'sudo tar -tzf /cluster/nfs/backups/LATEST/gitea.tgz | head'
ssh data-01 'sudo tar -tzf /cluster/nfs/backups/LATEST/apps-local.tgz | head'
ssh data-01 'sudo tar -tzf /cluster/nfs/backups/LATEST/grafana.tgz | head'
```

## 2. etcd (ctrl-01 only, cluster down)

```bash
ssh ctrl-01 'sudo systemctl stop k3s'
ssh ctrl-01 'sudo k3s server --cluster-reset --cluster-reset-restore-path=/mnt/nfs/snapshots/SNAPSHOTFILE'
# then start k3s; agents rejoin
```

k3s restore is a **reset**. Agents may need `k3s-agent` restart.

## 3. hostPath tarballs (service down)

Extract **on the node that owns the path**:

| tarball | node | dest |
|---|---|---|
| gitea.tgz | ctrl-01 | /cluster/local |
| apps-local.tgz | apps-01 | /cluster/local (open-webui, openclaw) |
| grafana.tgz | data-02 | /cluster/local |
| bastion-secrets.tgz | bastion | ~agent (mode 600) |

```bash
# example: Gitea
kubectl -n gitea scale deploy/gitea --replicas=0
ssh ctrl-01 'sudo tar -C /cluster/local -xzf /mnt/nfs/backups/STAMP/gitea.tgz'
kubectl -n gitea scale deploy/gitea --replicas=1
```

## 4. After any OpenClaw restore/recycle

Re-pair http://agent.lan:18789 (`openclaw devices approve`).
