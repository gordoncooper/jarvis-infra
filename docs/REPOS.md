# JARVIS git layout (decided 2026-09-13)

Living pins: **[`VERSION`](../VERSION)** in this repo. Do not treat a tag
mentioned below as current. `PHASE*` / old changelog lines are snapshots.

GitHub account: https://github.com/gordoncooper (private).
SOPS + age: **in git** (`secrets/secrets.sops.yaml`). Age private key is not.

Two repos:

- `gordoncooper/jarvis-infra` — metal, Ansible, bastion scripts, rebuild runbook, history, **homepage image**
- `gordoncooper/jarvis-cluster` — `git push --mirror` of Gitea (Flux YAML)

No third repo. No Flux -> GitHub.

## Secrets

**SOPS + age, in `jarvis-infra/secrets/`.** Encrypted file is tracked.
Age private key: bastion `~/.config/sops/age/keys.txt` (mode 600) + USB.
Never GitHub.

| | chmod 600 on bastion + NFS tarball | SOPS + age |
| --- | --- | --- |
| What | `~/.litellm-master.key` and `bastion-secrets.tgz` on data-01 | Same values, **encrypted**, in `jarvis-infra` |
| House power-loss | NFS + etcd restore | Same |
| House fire / disk death | GitHub has YAML but **no keys** | GitHub + USB of the **age private key** |
| Rebuild | `restore-bastion-secrets.sh` if NFS is intact | `materialize-bastion-secrets.sh` then `apply-secrets.sh` |

NFS backup is the right answer for **this rack** surviving a reboot.
SOPS is the right answer for **GitHub being enough to rebuild the house**.

## From-scratch order

See [REBUILD.md](REBUILD.md). Chicken-egg: Flux needs Gitea; Gitea is a cluster app.

1. Router DNS/DHCP
2. Ubuntu on 6 nodes + bastion, user `agent`
3. Clone **jarvis-infra**, checkout `$GIT_TAG` from `VERSION`, Ansible
4. k3s server on ctrl-01, agents join (`INSTALL_K3S_VERSION` from VERSION)
5. `install-jarvis-home.sh` **before** Flux
6. `kubectl apply` Gitea once (`bootstrap/gitea.yaml`)
7. Push cluster mirror into Gitea `jarvis/cluster` (or restore `gitea.tgz`)
8. Age key from USB → `materialize-bastion-secrets.sh` → `apply-secrets.sh`
9. `flux bootstrap git` against **git.lan**
10. `lan-https.sh` (mkcert `rootCA-key.pem` from USB)

GitHub never becomes authoritative. After rebuild, Gitea is origin again;
`mirror-to-github.sh` copies to GitHub.
