# jarvis-infra

Metal layer for the JARVIS home cluster (six M920x + bastion).

- **This repo** — Ansible, k3s join, Gitea bootstrap, secrets, TLS, backups
- **Gitea** `http://git.lan/jarvis/cluster.git` — Flux origin (authoritative)
- **GitHub** `gordoncooper/jarvis-cluster` — **mirror only**

**Start here for a from-scratch rebuild:** [docs/REBUILD.md](docs/REBUILD.md)  
**Mistakes we will not repeat:** [docs/LESSONS.md](docs/LESSONS.md)  
**How to use it day to day:** [docs/INTERACT.md](docs/INTERACT.md)

PHASE1–20 live in [docs/history/](docs/history/).

```
ansible-playbook playbooks/ping.yml
ansible-playbook playbooks/site.yml
./k3s/install-server.sh
./k3s/join-agents.sh
```
