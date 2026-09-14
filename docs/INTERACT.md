# How to talk to JARVIS

| Surface | URL / cmd | Best for | Model / cost |
|---|---|---|---|
| Command board | https://home.lan | Status at a glance | — |
| Chat | https://chat.lan | Q&A, RAG, voice, light coding | `jarvis-local` free; `jarvis-grok*` SuperGrok |
| Agent | http://agent.lan:18789 | Cluster ops, files, live metrics | `jarvis-grok-code` (API) |
| Goose | `goose session` on bastion | Terminal agent on the git repo | `jarvis-grok-code` via **https://llm.lan** |

| Grafana | https://grafana.lan | Graphs | — |
| API | http://llm.lan/v1 | Anything OpenAI-shaped | LiteLLM |
| GitOps | http://git.lan | YAML in `~/cluster` | — |
| SSH | `ssh bastion` → nodes | Break-glass | — |

**git.lan stays HTTP** (Flux). **agent.lan:18789** is HTTP on purpose (hostPort). Re-pair OpenClaw after its pod recycles.

Pick **jarvis-local** for chatter and RAG. Pick **jarvis-grok-code** when it must run tools or write YAML.
