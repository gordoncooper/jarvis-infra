# jarvis-infra

Metal, bootstrap, and the **command-center image** for JARVIS — a six-node
k3s homelab on ThinkCentre M920x, plus a bastion jump host.

This repo is **not** the Flux origin. Cluster YAML lives on Gitea
(`http://git.lan/jarvis/cluster.git`). GitHub
[gordoncooper/jarvis-cluster](https://github.com/gordoncooper/jarvis-cluster)
is a **mirror only**.

Living pins are **[`VERSION`](VERSION)** — `GIT_TAG` and `IMAGE` are
independent. Do not copy those numbers into scripts or `docs/REBUILD.md`.
Do not retag old git tags. Alignment: `scripts/check-contract.sh`.

| Item | Value |
| --- | --- |
| Pins | [`VERSION`](VERSION) |
| Run as | user **agent** (`HOME=/home/agent`). Never `bastion`. |
| Rebuild | [docs/REBUILD.md](docs/REBUILD.md) |
| Lessons | [docs/LESSONS.md](docs/LESSONS.md) |
| Day to day | [docs/INTERACT.md](docs/INTERACT.md) |
| Operator | [docs/OPERATING.md](docs/OPERATING.md) |
| Restore | [docs/RESTORE.md](docs/RESTORE.md) |
| Command center | [apps/jarvis-home/](apps/jarvis-home/) (`output/` is committed) |

## Why two repos

Infra owns **metal + the image**. Gitea owns **YAML**. GitHub cluster is a
read-only mirror so a house fire still has history.

```mermaid
flowchart LR
  classDef metal fill:#e0e7ff,stroke:#3730a3,color:#111827
  classDef gitops fill:#d1fae5,stroke:#047857,color:#111827
  classDef mirror fill:#f3f4f6,stroke:#6b7280,color:#111827

  subgraph metal["jarvis-infra  (this repo)"]
    ansible["Ansible / k3s join"]
    image["apps/jarvis-home image bundle"]
    secrets["SOPS templates"]
  end
  subgraph gitops["Gitea git.lan  - Flux origin"]
    yaml["clusters/jarvis YAML"]
  end
  subgraph mirror["GitHub jarvis-cluster"]
    gh["read-only mirror"]
  end
  agentN["agent on bastion"] --> ansible
  agentN --> image
  agentN -->|"push YAML"| yaml
  yaml -->|"reconcile"| flux["Flux on ctrl-01"]
  yaml -->|"mirror-to-github.sh"| gh

  class ansible,image,secrets metal
  class yaml,flux gitops
  class gh mirror
```

Chicken-egg: Flux needs Gitea; Gitea is a cluster app. Infra bootstraps Gitea
**once**, then Gitea owns YAML forever. Never point Flux at GitHub.

## Rack and roles

Six M920x (i7-8700T, 32 GiB) run k3s (see `K3S` in `VERSION`). Bastion is jump
only — **not** a k3s node, no node-exporter, no GPU.

```mermaid
flowchart TB
  classDef jump fill:#f3f4f6,stroke:#6b7280,color:#111827
  classDef ctrl fill:#e0e7ff,stroke:#3730a3,color:#111827
  classDef gpu fill:#d1fae5,stroke:#047857,color:#111827
  classDef store fill:#fef3c7,stroke:#b45309,color:#111827
  classDef apps fill:#fce7f3,stroke:#9d174d,color:#111827

  subgraph fabric["LAN 192.168.8.0/24"]
    bastion["bastion .10<br/>Ansible, kubectl, Goose, mkcert"]
    ctrl["ctrl-01 .11<br/>k3s server, etcd, Gitea, Flux, Traefik"]
    gpu1["gpu-01 .12<br/>RTX A1000 - Ollama chat 7B Q6"]
    gpu2["gpu-02 .13<br/>RTX A1000 - nomic-embed-text"]
    data1["data-01 .14<br/>NFS primary /cluster, snapshots"]
    data2["data-02 .15<br/>Prometheus, Grafana, kube-state"]
    apps["apps-01 .16<br/>WebUI, LiteLLM, Piper, OpenClaw, home.lan"]
  end
  bastion -.->|SSH| ctrl
  ctrl --- gpu1
  ctrl --- gpu2
  ctrl --- data1
  ctrl --- data2
  ctrl --- apps
  data1 -->|NFS| gpu1
  data1 -->|NFS| gpu2
  data1 -->|NFS| data2
  data1 -->|NFS| apps
  data1 -->|NFS| ctrl

  class bastion jump
  class ctrl ctrl
  class gpu1,gpu2 gpu
  class data1,data2 store
  class apps apps
```

| Host | IP | Role | Runs |
| --- | --- | --- | --- |
| bastion | 192.168.8.10 | jump | Ansible, kubectl, Goose. Not scheduled. |
| ctrl-01 | 192.168.8.11 | control + etcd | k3s server, Gitea, Flux, Traefik. Ingress VIP for LAN names. |
| gpu-01 | 192.168.8.12 | gpu-chat | Ollama jarvis-local (qwen2.5 7B Q6). |
| gpu-02 | 192.168.8.13 | gpu-embed | Ollama nomic-embed-text. |
| data-01 | 192.168.8.14 | storage-primary | NFS export /cluster. etcd snapshots, backups. |
| data-02 | 192.168.8.15 | metrics | Prometheus, Grafana, kube-state-metrics. |
| apps-01 | 192.168.8.16 | apps | Open WebUI, LiteLLM, Piper, OpenClaw, jarvis-home. |

Labels: `jarvis.role=control|gpu|storage|apps`. Homepage: `imagePullPolicy: Never`
on apps-01 only. Image tag is `IMAGE_TAG` in `VERSION`.

## How a browser request lands

```mermaid
sequenceDiagram
  actor You
  participant DNS as router DNS
  participant T as Traefik on ctrl-01
  participant H as jarvis-home on apps-01
  participant P as Prometheus on data-02
  You->>DNS: home.lan
  DNS-->>You: 192.168.8.11
  You->>T: HTTPS mkcert
  T->>H: Service homepage:3000
  H->>P: scrape :9090 (LIVE tiles)
  H-->>You: Home /status /api/telemetry
```

`agent.lan` is the exception: DNS **must** be 192.168.8.16 (hostPort 18789),
not ctrl-01.

## Surfaces

| URL | What |
| --- | --- |
| https://home.lan | Command center (Home + /status + 10-min event stream). Header LIVE = Prometheus. |
| https://chat.lan | Open WebUI (Whisper STT, Piper TTS) |
| http://agent.lan:18789 | OpenClaw. DNS must be .16. HTTP on purpose. |
| https://llm.lan/v1 | LiteLLM (jarvis-local, jarvis-grok, jarvis-grok-code) |
| http://git.lan | Gitea (HTTP on purpose — Flux origin) |
| https://grafana.lan | Grafana (NVIDIA dashboard 14574) |

LAN only. mkcert TLS. Never internet-exposed.

## What this repo contains

- `VERSION` — living git/image pins (source this file)
- `inventory/` + `playbooks/` + `roles/` — OS, UFW, NFS, NVIDIA, P300 as `/cluster`
- `k3s/` — server install (etcd on ctrl-01) and agent join
- `bootstrap/gitea.yaml` — first Gitea apply (before Flux exists)
- `apps/jarvis-home/` — Dockerfile + committed `output/` SSR bundle
- `scripts/install-jarvis-home.sh` — docker build on apps-01, `k3s ctr import`
- `scripts/check-contract.sh` / `verify-jarvis.sh` — pin + live proof
- `scripts/mirror-to-github.sh` — Gitea to GitHub cluster mirror
- `docs/` — OPERATING, INTERACT, REBUILD, RESTORE, LESSONS; `docs/history/` is frozen
- `secrets/` — SOPS+age (`secrets.sops.yaml` in git; age key is not)
- `systemd/` — nightly NFS backup timer (unit path is this repo)

Greenfield does **not** run `npm run build` on the cluster.

```
ansible-playbook playbooks/ping.yml
ansible-playbook playbooks/site.yml
./k3s/install-server.sh
./k3s/join-agents.sh
./scripts/install-jarvis-home.sh
```

Full order: [docs/REBUILD.md](docs/REBUILD.md).
