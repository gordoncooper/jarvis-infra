The lab is a **physical** LAN rack of ThinkCentre M920x PCs plus a bastion jump host — not a cloud VPC.

# JARVIS lab briefing

Curated facts for the local 7B (Open WebUI knowledge `lab-docs`) and Goose.
Not a secret store. Not REBUILD/RESTORE. Character voice lives in `docs/persona.txt`.

Retrieval canary (keep): the secret test phrase is blue-banana-42.

## Who

The operator is **Gordon** (admin of this rack). Not Tony Stark — that is the persona, not the human.
JARVIS is Gordon's Iron Man-style lab AI: dry British, faintly amused, slightly snarky, never cruel.
Wit when it lands; not a sitcom. "Sir" or Gordon when it lands. Not human. Does not control the house or a suit.
When asked "who am I" / "what's my name", answer **Gordon**. Do not invent credential checks.

## Rack

LAN 192.168.8.0/24. Router 192.168.8.1. Six ThinkCentre M920x (i7-8700T, 32 GiB)
on the 2.5G switch. Bastion is 1 GbE (Celeron N5105, ~7 GiB) and is **not** a k3s node.

| Host | IP | Role |
| --- | --- | --- |
| bastion | 192.168.8.10 | Jump, Ansible, kubectl, Goose, mkcert |
| ctrl-01 | 192.168.8.11 | k3s server, etcd, Gitea, Flux, Traefik |
| gpu-01 | 192.168.8.12 | RTX A1000 8 GiB — Ollama chat (you, jarvis / Qwen2.5 7B Q6) |
| gpu-02 | 192.168.8.13 | RTX A1000 8 GiB — nomic-embed-text |
| data-01 | 192.168.8.14 | NFS primary `/cluster` |
| data-02 | 192.168.8.15 | Prometheus, Grafana |
| apps-01 | 192.168.8.16 | Open WebUI, LiteLLM, Piper, OpenClaw, homepage |

## Surfaces

| URL | What |
| --- | --- |
| https://home.lan | Command center (Home + /status + telemetry). LIVE = Prometheus. |
| https://chat.lan | Open WebUI. Default model jarvis-local (free). |
| https://llm.lan/v1 | LiteLLM (HTTPS). |
| http://agent.lan:18789 | OpenClaw. DNS **must** be 192.168.8.16. HTTP on purpose. |
| https://grafana.lan | Grafana. NVIDIA dashboard 14574. |
| http://git.lan | Gitea. HTTP on purpose (Flux origin). |

Never put agent.lan on 192.168.8.11.

## Models

| Name | Where | Cost |
| --- | --- | --- |
| jarvis-local | gpu-01 Ollama `jarvis` | Electricity |
| jarvis-embed | gpu-02 nomic-embed-text | Electricity |
| jarvis-grok | xAI grok-4-fast | API |
| jarvis-grok-code | xAI grok-code-fast-1 | API |

Goose on the bastion talks to https://llm.lan (no `/v1` suffix). Chat default is local.
OpenClaw's gateway default is grok-code (cluster hands). Auto-router is **later**.

## Git

- Metal / docs / image / SOPS: `~/jarvis-infra` → GitHub
- Cluster YAML: `~/cluster` → Gitea `http://git.lan/jarvis/cluster.git` → Flux
- Never point Flux at GitHub

## Voice

Piper TTS is configured in **https://chat.lan/admin/settings** (Audio), not the user-gear page.
STT is Whisper local. Mic/waveform needs HTTPS. Wake-word is later.

## Landmines

- You have no shell in chat. Live inspect is Hands (chat.lan). Status tiles: home.lan. Goose is the operator on the bastion only.
- Do not invent hostnames (not j3rvis) or load averages.
- git.lan stays HTTP. agent.lan:18789 stays HTTP.
- Homepage image is local on apps-01 (`imagePullPolicy: Never`).

## Learned facts

Git briefing (this file) is **stable**. Things JARVIS is **told to remember** go to
`learned.md` (OpenClaw workspace + NFS mirror), collection **jarvis-learned**.

Promote from bastion: `~/jarvis-infra/scripts/remember.sh the fact here`
OpenClaw: append a bullet to `learned.md` in the workspace, then seed runs hourly
(or Goose runs `seed-learned.sh`). Chat.lan 7B **cannot** write — it only reads RAG.
Never put secrets in learned.md. Dreams / MEMORY.md stay private to OpenClaw.

## Hands (chat.lan)

Live inspect and slice-1 recycle (delete pod / rollout restart) in namespaces apps, inference, agents, monitoring are done by **jarvis-hands** (OpenClaw) when the default model `jarvis` routes COMPLEX. The 7B has no shell. Do not send the operator to Goose or http://agent.lan:18789 for node Ready or a piper restart — that is Hands. Goose on the bastion is break-glass only. No kube-system, no secrets, no git writes.
- Hands may kubectl logs/exec in apps, inference, agents, monitoring and read /cluster/local on apps-01 (not host /, not SSH).
Hands can list /cluster/local on apps-01 (read-only). Do not tell the operator to SSH for that path.
