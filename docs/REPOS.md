# JARVIS git layout (decided 2026-09-13)

Live Gitea command center: **021d7a3** (`apps: jarvis-home v0.2 — srvx --prod, no npx`).
Known-good paired tags: **v0.4.4** on both repos (cluster already had v0.3–v0.4.3).

GitHub account: https://github.com/gordoncooper (private).
SOPS + age: **yes**.


Two repos:

- `gordoncooper/jarvis-infra` — metal, Ansible, bastion scripts, rebuild runbook, history
- `gordoncooper/jarvis-cluster` — `git push --mirror` of Gitea (Flux YAML)

No third repo. No Flux → GitHub.

## Secrets (SOPS) — preference

**Preferred: SOPS + age, in `jarvis-infra/secrets/`, after the live export.**

Plain English: git cannot hold your xAI key, LiteLLM master key, Grafana
password, Gitea token, or OpenClaw gateway token in the clear. Two options:

| | chmod 600 on bastion + NFS tarball | SOPS + age |
|---|---|---|
| What | Values live in files like `~/.litellm-master.key` and in `bastion-secrets.tgz` on data-01 | Same values, **encrypted**, committed to `jarvis-infra` |
| House power-loss | NFS + etcd restore — you already have this | Same |
| House fire / disk death | GitHub has YAML but **no keys** — you re-create every secret by hand | GitHub + a USB/print of the **age private key** rebuilds secrets |
| Extra moving parts | None | `age-keygen` once; `sops` on bastion |
| Cost | $0 | $0 (no SaaS, no KMS) |

NFS backup is the right answer for **this rack** surviving a reboot.
SOPS is the right answer for **GitHub being enough to rebuild the house**.

You asked for complete from-scratch repos. That implies SOPS.
Plan: land the two repos from the live export **with `*.example` secret
templates and a checklist**, then add encrypted `*.sops.yaml` in the same
week so we are not blocked on learning SOPS to publish GitHub.

The **age private key** still is not in GitHub. One copy: bastion
`~/.config/sops/age/keys.txt` (mode 600). Second copy: USB in a drawer.
That USB is the only remaining “click-ops” secret.

## From-scratch order (what REBUILD.md will be)

Chicken-egg: Flux needs Gitea; Gitea is a cluster app.

1. Router DNS/DHCP (GL-BE9300 checklist — click-ops)
2. Ubuntu on 6 nodes + bastion, user `agent`, SSH keys
3. Clone **jarvis-infra**, run Ansible (`site.yml`) — disks, NFS, UFW, NVIDIA
4. k3s server on ctrl-01 from `k3s/config.yaml`, agents join with labels
5. `kubectl apply` Gitea **once** (from infra `bootstrap/gitea.yaml`, same as today)
6. Create Gitea `jarvis/cluster`, push **jarvis-cluster** mirror into it
   (or restore `gitea.tgz` from NFS if this is a repair)
7. `flux bootstrap git` against **git.lan** (not GitHub)
8. Create k8s secrets from SOPS (or the checklist): LiteLLM, xAI, Grafana,
   OpenClaw gateway
9. `lan-https.sh` (new CA if the old mkcert key is gone)
10. `./scripts/install-jarvis-home.sh` **before** Flux applies homepage (or immediately after on `ErrImageNeverPull`)
11. Restore hostPath tarballs **only if** you want old chats/dashboards;
    otherwise greenfield (models re-pull)

GitHub never becomes authoritative. After rebuild, Gitea is origin again;
a timer on the bastion mirrors to GitHub.
