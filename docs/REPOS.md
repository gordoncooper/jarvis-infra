# JARVIS git layout

Living pins: **[`VERSION`](../VERSION)**. `PHASE*` lines are snapshots.

GitHub: https://github.com/gordoncooper (private). SOPS: planned, not required yet.

Two repos:

- `gordoncooper/jarvis-infra` — metal, Ansible, rebuild runbook, homepage image
- `gordoncooper/jarvis-cluster` — mirror of Gitea (Flux YAML)

No third repo. No Flux to GitHub.

See [REBUILD.md](REBUILD.md). Secrets until SOPS: chmod 600 on bastion + restore-bastion-secrets.sh.
