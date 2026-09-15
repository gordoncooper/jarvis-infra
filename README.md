# jarvis-infra

Metal, bootstrap, and the command-center image for JARVIS.

This repo is **not** the Flux origin. Cluster YAML lives on Gitea
(http://git.lan/jarvis/cluster.git). GitHub gordoncooper/jarvis-cluster is a mirror only.

Living pins are [`VERSION`](VERSION) — GIT_TAG and IMAGE are independent.
Do not copy those numbers into scripts or docs/REBUILD.md. Alignment: scripts/check-contract.sh.

| Item | Value |
| --- | --- |
| Pins | [`VERSION`](VERSION) |
| Run as | user **agent** (HOME=/home/agent). Never bastion. |
| Rebuild | [docs/REBUILD.md](docs/REBUILD.md) |
| Lessons | [docs/LESSONS.md](docs/LESSONS.md) |
| Day to day | [docs/INTERACT.md](docs/INTERACT.md) |
| Command center | [apps/jarvis-home/](apps/jarvis-home/) |

## Why two repos

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

Chicken-egg: Flux needs Gitea; Gitea is a cluster app. Infra bootstraps Gitea once.

## Rack and roles

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

| Host | IP | Role |
| --- | --- | --- |
| bastion | 192.168.8.10 | jump |
| ctrl-01 | 192.168.8.11 | control + etcd |
| gpu-01 | 192.168.8.12 | gpu-chat |
| gpu-02 | 192.168.8.13 | gpu-embed |
| data-01 | 192.168.8.14 | storage-primary |
| data-02 | 192.168.8.15 | metrics |
| apps-01 | 192.168.8.16 | apps |

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

agent.lan DNS must be 192.168.8.16 (hostPort 18789), not ctrl-01.

Full order: [docs/REBUILD.md](docs/REBUILD.md).
