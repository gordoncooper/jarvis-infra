# JARVIS Phase 3 — Gitea + Flux  COMPLETE 2026-08-30

| Item | Value |
|---|---|
| Gitea | 1.26.4, SQLite, hostPath `/cluster/local/gitea` on ctrl-01 |
| URL | http://git.lan  (user `jarvis`, pass in `~/.gitea-admin.pass` on bastion) |
| Repo | http://git.lan/jarvis/cluster.git |
| Flux | 2.9.4, namespace `flux-system`, path `clusters/jarvis` |
| Sync | `flux-system` Ready, revision `main@sha1:f8e7af63` |

## Lessons

- Do not `ssh bastion` from the bastion (password loop).
- `flux bootstrap gitea` refuses HTTP basic auth. Use
  `flux bootstrap git --allow-insecure-http --token-auth`.
- Gitea is **not** managed by Flux (chicken-egg). Keep it kubectl/ansible.
- HTTP is LAN-only; TLS later.

## Working clone on bastion

```bash
TOKEN=$(cat ~/.gitea-flux.token)
git clone http://jarvis:${TOKEN}@git.lan/jarvis/cluster.git ~/cluster
```

Future apps: commit under `~/cluster/clusters/jarvis/` and `git push`.
Do not `kubectl apply` (except Gitea itself).
