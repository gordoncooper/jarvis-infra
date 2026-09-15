# JARVIS git layout (decided 2026-09-13)

Living pins: **[`VERSION`](../VERSION)** in this repo. Do not treat a tag
mentioned below as current. `PHASE*` / old changelog lines are snapshots.

GitHub account: https://github.com/gordoncooper (private).
SOPS + age: **planned** (secrets still chmod 600 on bastion until that lands).

Two repos:

- `gordoncooper/jarvis-infra` — metal, Ansible, bastion scripts, rebuild runbook, history, **homepage image**
- `gordoncooper/jarvis-cluster` — `git push --mirror` of Gitea (Flux YAML)

No third repo. No Flux -> GitHub.

## Secrets (SOPS) — preference

**Preferred: SOPS + age, in `jarvis-infra/secrets/`.** Not done yet.
Until `secrets/secrets.sops.yaml` exists, rebuild uses
`restore-bastion-secrets.sh` + `~/.litellm-master.key` etc.

| | chmod 600 on bastion + NFS tarball | SOPS + age |
| --- | --- | --- |
| What | `~/.litellm-master.key` and `bastion-secrets.tgz` on data-01 | Same values, **encrypted**, in `jarvis-infra` |
| House power-loss | NFS + etcd restore | Same |
| House fire / disk death | GitHub has YAML but **no keys** | GitHub + USB/print of the **age private key** |
| Extra moving parts | None | `age-keygen` once; `sops` on bastion |

NFS backup is the right answer for **this rack** surviving a reboot.
SOPS is the right answer for **GitHub being enough to rebuild the house**.

The **age private key** is not in GitHub. Bastion `~/.config/sops/age/keys.txt`
(mode 600) + USB in a drawer.

## From-scratch order

See [REBUILD.md](REBUILD.md). Chicken-egg: Flux needs Gitea; Gitea is a cluster app.

1. Router DNS/DHCP
2. Ubuntu on 6 nodes + bastion, user `agent`
3. Clone **jarvis-infra**, checkout `$GIT_TAG` from `VERSION`, Ansible
4. k3s server on ctrl-01, agents join
5. `install-jarvis-home.sh` **before** Flux
6. `kubectl apply` Gitea once (`bootstrap/gitea.yaml`)
7. Push cluster mirror into Gitea `jarvis/cluster` (or restore `gitea.tgz`)
8. Secrets from bastion files (SOPS later)
9. `flux bootstrap git` against **git.lan**
10. `lan-https.sh`

GitHub never becomes authoritative. After rebuild, Gitea is origin again;
`mirror-to-github.sh` copies to GitHub.
