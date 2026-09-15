# How to talk to JARVIS

Operator/copilot contract: [OPERATING.md](OPERATING.md). Pins: `~/jarvis-infra/VERSION`.
Proof: `~/jarvis-infra/scripts/verify-jarvis.sh`.

| Surface | URL / cmd | Best for | Model / cost |
| --- | --- | --- | --- |
| Command board | https://home.lan | Services + rack + compact events. Header **LIVE** = Prometheus; **SIM** = fallback. | — |
| Status floor | https://home.lan/status | GPU temp/VRAM, 10-min event stream, node CPU/RAM, workloads | — |
| Telemetry | https://home.lan/api/telemetry | JSON snapshot (source, GPUs, events) | — |
| Chat | https://chat.lan | Q&A, RAG, voice | `jarvis-local` free; `jarvis-grok*` SuperGrok |
| Agent | http://agent.lan:18789 | Cluster ops, files, live metrics | `jarvis-grok-code` (API) |
| Goose | `goose session` on bastion | Terminal agent on the git repo | `jarvis-grok-code` via **https://llm.lan** |
| Grafana | https://grafana.lan | Graphs (NVIDIA 14574) | — |
| API | https://llm.lan/v1 | Anything OpenAI-shaped | LiteLLM |
| GitOps | http://git.lan | YAML in `~/cluster` as **agent** | — |
| SSH | `ssh bastion` -> nodes | Break-glass | — |

**git.lan stays HTTP** (Flux). **agent.lan:18789** is HTTP on purpose (hostPort).
Re-pair OpenClaw after its pod recycles. DNS for agent.lan is **192.168.8.16**.

Pick **jarvis-local** for chatter and RAG. Pick **jarvis-grok-code** when it must run tools or write YAML.

Grafana NVIDIA dashboard 14574: Host variable query `nvidia_smi_gpu_info` (or export `index`); Refresh = On dashboard load; Save dashboard.
Piper TTS: **https://chat.lan/admin/settings** (not User Settings). Waveform/mic needs HTTPS.

Audio click-ops: [open-webui-audio.md](open-webui-audio.md). RAG: [open-webui-knowledge.md](open-webui-knowledge.md).
