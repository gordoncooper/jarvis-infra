# jarvis-infra

Metal layer for the JARVIS home cluster (six M920x + bastion).

- **This repo** — Ansible, k3s join, Gitea bootstrap, secrets, TLS, backups, **jarvis-home image (Home + Status)**
- **Gitea** `http://git.lan/jarvis/cluster.git` — Flux origin (authoritative)
- **GitHub** `gordoncooper/jarvis-cluster` — **mirror only**

**Start here for a from-scratch rebuild:** [docs/REBUILD.md](docs/REBUILD.md)  
**Mistakes we will not repeat:** [docs/LESSONS.md](docs/LESSONS.md)  
**How to use it day to day:** [docs/INTERACT.md](docs/INTERACT.md)

Command center source: [apps/jarvis-home/](apps/jarvis-home/) (`output/` is the production bundle — commit it).

PHASE1–21 live in [docs/history/](docs/history/). Known-good tag: **v0.4.4**.

```
ansible-playbook playbooks/ping.yml
ansible-playbook playbooks/site.yml
./k3s/install-server.sh
./k3s/join-agents.sh
./scripts/install-jarvis-home.sh    # before Flux
```
