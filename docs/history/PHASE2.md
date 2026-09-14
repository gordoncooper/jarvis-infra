# JARVIS Phase 2 — k3s  COMPLETE 2026-08-30

Five nodes Ready, embedded **etcd**, NFS snapshot works.
kube-system: coredns, traefik, local-path, metrics-server, svclb — Running.

| Item | Value |
|---|---|
| k3s | v1.36.4+k3s1 |
| ctrl-01 | Ready, roles `control-plane,etcd` |
| gpu-01 / data-01 / data-02 / apps-01 | Ready agents |
| gpu-02 | still absent |
| datastore | `/var/lib/rancher/k3s/server/db/etcd` |
| snapshot | `/cluster/nfs/snapshots/on-demand-ctrl-01-*` (~7 MB) |
| config | `/etc/rancher/k3s/config.yaml` — also `k3s/config.yaml` in this repo |

## NFS paths (not a bug)

data-01 **exports** `/cluster/nfs`. It must **not** NFS-mount itself.
Snapshots from ctrl-01 go to `/mnt/nfs/snapshots` = the export.

| Host | Snapshot path |
|---|---|
| data-01 | `/cluster/nfs/snapshots` (real disk) |
| ctrl-01, gpu-01, data-02, apps-01 | `/mnt/nfs/snapshots` (NFS client) |

After the convenience symlink (`ln -s /cluster/nfs /mnt/nfs` on data-01),
both paths work on the server too. That is a symlink, not a loopback NFS mount.

## Snapshot rule (k3s 1.36)

`k3s etcd-snapshot save` loads `config.yaml`. Do **not** also pass `--dir`
(duplicate of `etcd-snapshot-dir` → fatal). Unknown-flag warnings on server
keys are noise.

```bash
ssh ctrl-01 'sudo k3s etcd-snapshot save'
ssh data-01 'ls -lh /cluster/nfs/snapshots'
```

## How we should have installed (for gpu-02 / rebuild)

1. Write `k3s/config.yaml` to ctrl-01 **before** the installer runs.
2. `curl -sfL https://get.k3s.io | sh -`  (no extra INSTALL_K3S_EXEC; config.yaml is enough)
3. Wait until `k3s kubectl get --raw=/readyz` is `ok` **and** the node is Ready with roles `control-plane,etcd`.
4. `sudo k3s etcd-snapshot save`  (no `--dir`)
5. Join agents with K3S_URL + token + node-ip + labels.

## Do not

- Convert SQLite → etcd on a live cluster (`cluster-init` after the fact hung).
- Re-run k3s-uninstall unless you intend a wipe.
- NFS-mount `/cluster/nfs` on data-01.

## Labels (locked)

```
ctrl-01  jarvis.role=control
gpu-01   jarvis.role=gpu jarvis.gpu=chat
data-01  jarvis.role=storage jarvis.storage=primary
data-02  jarvis.role=storage jarvis.storage=replica
apps-01  jarvis.role=apps
```
