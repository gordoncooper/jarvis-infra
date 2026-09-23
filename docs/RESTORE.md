# JARVIS restore (after power loss)

Procedure only. Pins live in [`VERSION`](../VERSION).
Operator contract: [OPERATING.md](OPERATING.md). Rebuild from scratch: [REBUILD.md](REBUILD.md).

Do **not** restore unless the live cluster (or that component) is actually dead.
The 2026-09-22 rehearsal unpacked stamp `20260922-0331` into
`/cluster/nfs/rehearsal-20260922-0331` on data-01 and removed that directory.
It did **not** write `$HOME` or `/cluster/local`. Every archived name was still
on the live tree. Size drift was files written after 03:31.

Stamp `20260922-2252` was extracted the same way and removed. `gitea.db`,
`webui.db`, `promoted.sqlite`, and `sessions.sqlite` passed integrity check.
`restore-bastion-secrets.sh` was pointed at an empty directory, not the real
`$HOME`: the 12 secret files matched and were mode 600, then shredded. The
etcd file in the stamp matches the k3s snapshot. It was not applied.

Backups: `data-01:/cluster/nfs/backups/<STAMP>/`
etcd: `ctrl-01:/mnt/nfs/snapshots/` (NFS: `data-01:/cluster/nfs/snapshots`).
data-01 is the NFS server (`/cluster/nfs/...`). Other nodes mount that at `/mnt/nfs`.
data-02 is not a copy of this tree. It runs Prometheus and Grafana. A restore
puts Grafana's hostPath back from the data-01 stamp. It does not make data-02
a second backup.

Run every command as **agent**. Always `ssh -n`.

## 1. Confirm the stamp (read-only)

Pick `STAMP` (newest successful `OK` from `journalctl -u jarvis-backup.service`).

```bash
STAMP=YYYYMMDD-HHMM   # example: 20260915-0331
ssh -n data-01 "sudo ls -lh /cluster/nfs/backups/$STAMP"
ssh -n data-01 "sudo sh -c 'for f in /cluster/nfs/backups/'$STAMP'/*.tgz; do gzip -t \"$f\" && echo gzip_ok \"$f\"; done'"
ssh -n data-01 "sudo tar -tzf /cluster/nfs/backups/$STAMP/gitea.tgz | head"
ssh -n data-01 "sudo tar -tzf /cluster/nfs/backups/$STAMP/apps-local.tgz | grep -E '^(open-webui/webui.db|openclaw/)'"
ssh -n data-01 "sudo tar -tzf /cluster/nfs/backups/$STAMP/grafana.tgz | head"
ssh -n data-01 "sudo tar -tzf /cluster/nfs/backups/$STAMP/bastion-secrets.tgz"
ssh -n ctrl-01 "sudo k3s etcd-snapshot ls --config /etc/rancher/k3s/snapshot.yaml | tail"
```

Expect `gitea.tgz`, `grafana.tgz`, `apps-local.tgz`, `bastion-secrets.tgz` (mode 600), `jarvis-learned.tgz`, and one `on-demand-ctrl-01-*` etcd snapshot copied into this directory. Model weights are not in the stamp.

## 2. hostPath tarballs (that component down)

Extract **on the node that owns the path**. Scale the workload to 0 first.
NFS clients use `/mnt/nfs/backups/$STAMP/...`. On data-01 itself use `/cluster/nfs/backups/...`.

| tarball | node | dest (tar -C) | contains |
| --- | --- | --- | --- |
| `gitea.tgz` | ctrl-01 | `/cluster/local` | `gitea/` |
| `grafana.tgz` | data-02 | `/cluster/local` | `grafana/` |
| `apps-local.tgz` | apps-01 | `/cluster/local` | `open-webui/` + `openclaw/` |

```bash
# Gitea
kubectl -n gitea scale deploy/gitea --replicas=0
ssh -n ctrl-01 "sudo tar -C /cluster/local -xzf /mnt/nfs/backups/$STAMP/gitea.tgz"
kubectl -n gitea scale deploy/gitea --replicas=1
kubectl -n gitea rollout status deploy/gitea

# Grafana
kubectl -n monitoring scale deploy/grafana --replicas=0
ssh -n data-02 "sudo tar -C /cluster/local -xzf /mnt/nfs/backups/$STAMP/grafana.tgz"
kubectl -n monitoring scale deploy/grafana --replicas=1

# Open WebUI + OpenClaw
kubectl -n apps scale deploy/open-webui --replicas=0
kubectl -n agents scale deploy/openclaw --replicas=0
ssh -n apps-01 "sudo tar -C /cluster/local -xzf /mnt/nfs/backups/$STAMP/apps-local.tgz"
kubectl -n apps scale deploy/open-webui --replicas=1
kubectl -n agents scale deploy/openclaw --replicas=1
```

`WEBUI_SECRET_KEY` lives in the apps secret / `apps-local.tgz`, not in SOPS.

### Product memory (`jarvis-learned.tgz`)

This is not `/cluster/local`. Stop the orchestrator first so sqlite is not open.

```bash
kubectl -n apps scale deploy/jarvis-orchestrator --replicas=0
ssh -n data-01 "sudo tar -C /cluster/nfs -xzf /cluster/nfs/backups/$STAMP/jarvis-learned.tgz"
kubectl -n apps scale deploy/jarvis-orchestrator --replicas=1
```

Contains `promoted.sqlite`, `sessions.sqlite`, `learned.md`, and `files/`. No model weights.

## 3. Bastion secrets

If NFS survived and this is a **new or wiped** `$HOME`:

```bash
./scripts/restore-bastion-secrets.sh "$STAMP"
# default is tar -k (skip files that already exist)
# FORCE=1 ./scripts/restore-bastion-secrets.sh "$STAMP"   # overwrite, wiped HOME only
./bootstrap/apply-secrets.sh
```

If NFS is gone but the age private key is on USB:

```bash
chmod 600 ~/.config/sops/age/keys.txt
./scripts/materialize-bastion-secrets.sh
./bootstrap/apply-secrets.sh
```

Do not unpack `bastion-secrets.tgz` onto a healthy bastion whose hashes already MATCH (dry-run 11/11). That is a no-op with `tar -k`. The tarball also carries the node SSH keys `id_ed25519` and `id_rsa`.

## 4. Homepage image (not in NFS)

Image lives in k3s containerd on **apps-01** only (`imagePullPolicy: Never`).
After an apps-01 wipe or greenfield k3s:

```bash
./scripts/install-jarvis-home.sh
kubectl -n apps delete pod -l app=homepage
# expect https://home.lan/ and https://home.lan/status both 200
```

## 5. etcd (ctrl-01 only, cluster actually down)

This is a **reset**. Do not run it to "refresh" a healthy cluster.
Agents may need `k3s-agent` restarted after.

```bash
# SNAPSHOTFILE = a name from: ssh -n ctrl-01 'sudo ls /mnt/nfs/snapshots'
ssh -n ctrl-01 'sudo systemctl stop k3s'
ssh -n ctrl-01 'sudo k3s server --cluster-reset --cluster-reset-restore-path=/mnt/nfs/snapshots/SNAPSHOTFILE'
# then start k3s; restart k3s-agent on workers if they do not rejoin
```

Scheduled files are `etcd-snapshot-ctrl-01-*`. Nightly backup also writes `on-demand-ctrl-01-*` and copies that file into the stamp. `/mnt/nfs/snapshots` is still where k3s writes it. On ctrl-01 the stamp copy is `/mnt/nfs/backups/$STAMP/on-demand-ctrl-01-*`. A failed snapshot is not `OK`.

## 6. After

- Re-pair OpenClaw at http://agent.lan:18789 (`openclaw devices approve`).
- `./scripts/check-contract.sh`
- `./scripts/verify-jarvis.sh`
