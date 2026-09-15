# jarvis-infra

Metal layer for the JARVIS home cluster (six M920x + bastion).

| | |
|---|---|
| **This repo** | Ansible, k3s join, Gitea bootstrap, secrets, TLS, backups, **jarvis-home image** |
| **Gitea** | `http://git.lan/jarvis/cluster.git` — Flux origin (authoritative) |
| **GitHub cluster** | `gordoncooper/jarvis-cluster` — **mirror only** |

**Known-good git tag: v0.4.4** (`jarvis-home:v0.2`). This tree: **jarvis-home:v0.4.5** (Prometheus tiles).

**Rebuild:** [docs/REBUILD.md](docs/REBUILD.md) · **Lessons:** [docs/LESSONS.md](docs/LESSONS.md) · **Day to day:** [docs/INTERACT.md](docs/INTERACT.md)  
**Command center:** [apps/jarvis-home/](apps/jarvis-home/) (`output/` is committed)

| URL | App |
|---|---|
| https://home.lan | Command center (Home) |
| https://home.lan/status | Status floor |
| https://chat.lan | Open WebUI |
| http://agent.lan:18789 | OpenClaw |
| https://grafana.lan | Grafana |
| http://git.lan | Gitea |
| https://llm.lan | LiteLLM |
