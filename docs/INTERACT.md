# How to talk to JARVIS

| Surface | URL / cmd | Best for |
| --- | --- | --- |
| Command board | https://home.lan | Rack + compact events. Header LIVE = Prometheus. |
| Status floor | https://home.lan/status | GPUs + 10-min event stream |
| Telemetry | https://home.lan/api/telemetry | JSON snapshot |
| Chat | https://chat.lan | Q&A, RAG, voice |
| Agent | http://agent.lan:18789 | Cluster ops (DNS must be 192.168.8.16) |
| Goose | goose session on bastion | Terminal agent |
| Grafana | https://grafana.lan | NVIDIA 14574 |
| API | https://llm.lan/v1 | OpenAI-shaped |
| GitOps | http://git.lan | YAML in ~/cluster as agent |

Pins: `~/jarvis-infra/VERSION`. Proof: `~/jarvis-infra/scripts/verify-jarvis.sh`.
