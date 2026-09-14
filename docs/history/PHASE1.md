# JARVIS Phase 1 — OS baseline (COMPLETE on 2026-08-30)

Run on **bastion** (`192.168.8.10`) as user `agent`.
No k3s in this phase.

`gpu-02` is omitted from inventory until it SSHs.

## What actually landed

| Check | Result |
|---|---|
| 5 nodes SSH, `.11–.16`, `multi-user.target` | done |
| Patriots at `/cluster` (P300 by **model**, not nvme0/nvme1) | done |
| NFS `data-01:/cluster/nfs` → `/mnt/nfs` NFSv4.2 | done |
| gpu-01 RTX A1000, driver **595.71.05 server-open**, CUDA 13.2 | done |
| UFW LAN-only (+ k3s ports pre-opened for Phase 2) | done |
| gpu-02 | skipped |

## Lessons baked into this repo (do not regress)

1. **ansible-core 2.20** (Ubuntu 26.04 `ansible 13`): no `stdout_callback = yaml`. Use `ansible.builtin.default` + `[callback_default] result_format = yaml`. `command:` does not run `hostname; hostname -I` — use `shell`.
2. **Patriot names are swapped.** ctrl-01/apps-01 = `nvme1n1`; data-01/data-02 = `nvme0n1`. Match model `P300`.
3. **Ubuntu 26.04 NVIDIA:** `ubuntu-drivers autoinstall` is gone. Use `ubuntu-drivers install --gpgpu`, then **`nvidia-utils-595-server`** or there is no `nvidia-smi`.
4. **NFS:** no `fsid=0`, no `x-systemd.automount`. Export `/cluster/nfs`, client `vers=4.2,proto=tcp`. Never `failed_when: false` on mount. Verify with **`findmnt`**, not `df` (df on an unmounted dir lies).
5. CPU is **i7-8700** (not 8700T). NIC is **`eno1`**.

## Re-run (idempotent)

```bash
cd ~/jarvis-cluster
ansible-playbook playbooks/ping.yml
ansible-playbook playbooks/identify-disks.yml
ansible-playbook playbooks/site.yml          # pauses only if CLUSTER label missing
ansible-playbook playbooks/verify.yml
```

`verify.yml` must show `nfs=data-01:/cluster/nfs nfs4` on ctrl-01, gpu-01, data-02, apps-01. data-01 is the server (`nfs=not-mounted` is OK there).

## When gpu-02 returns

1. Same BIOS as gpu-01 (IGD, restore-on-AC).
2. Uncomment `gpu-02` in `inventory/hosts.yml` (cluster, gpu, nfs_clients).
3. `ansible-playbook playbooks/site.yml --limit gpu-02`

## Not in this phase

- k3s / Flux / Gitea — see `PHASE2.md`
- Ollama
- Reclaiming leftover Windows NTFS (~78 GB) on every 256G OS disk
