# How to talk to JARVIS

Operator/copilot contract: [OPERATING.md](OPERATING.md). Pins: `~/jarvis-infra/VERSION`.
Proof: `~/jarvis-infra/scripts/verify-jarvis.sh`.

| Surface | URL / cmd | Best for | Model / cost |
| --- | --- | --- | --- |
| Command board | https://home.lan | Services + rack + events. **Click tiles** for dossiers (pods on that node). **LIVE** = Prometheus; **SIM** = fallback. | — |
| Status floor | https://home.lan/status | GPU temp/VRAM, event stream, nodes/workloads. Same click-dossiers. | — |
| Telemetry | https://home.lan/api/telemetry | JSON: source, GPUs, events, `podsByNode` | — |
| Chat | https://chat.lan | Q&A, RAG, voice | `jarvis-local` free; `jarvis-grok*` SuperGrok |
| Agent | http://agent.lan:18789 | Cluster ops, files, live metrics | `jarvis-grok-code` (API) |
| Goose | `goose session` on bastion | Terminal agent on the git repo | Live default **jarvis-local** via **https://llm.lan**; grok-code when you need tools |
| Grafana | https://grafana.lan | Graphs (NVIDIA 14574) | — |
| API | https://llm.lan/v1 | Anything OpenAI-shaped | LiteLLM |
| GitOps | http://git.lan | YAML in `~/cluster` as **agent** | — |
| SSH | `ssh bastion` -> nodes | Break-glass | — |

**git.lan stays HTTP** (Flux). **agent.lan:18789** is HTTP on purpose (hostPort).
Re-pair OpenClaw after its pod recycles. DNS for agent.lan is **192.168.8.16**.

Default path (target): one alias **`jarvis`** — LiteLLM routes. Picker stays as Tony's override. Indicator chip = which model ran, not a selector. North star: [PLAN.md](PLAN.md).

Default model is LiteLLM alias **`jarvis`** (router). Inspect prompts get LIVE telemetry via `scripts/owui-telemetry-filter.py` (OWUI global filter). Picker still has the raw ids as Tony's override.

Grafana NVIDIA dashboard 14574: Host variable query `nvidia_smi_gpu_info` (or export `index`); Refresh = On dashboard load; Save dashboard. Drift vs git: `~/jarvis-infra/scripts/export-clickops.sh` (stamped dir under `~`; not a backup).
Piper TTS: **https://chat.lan/admin/settings** (not User Settings). Waveform/mic needs HTTPS.

Chat chrome: ConfigMap `jarvis-webui-hud` (teal HUD CSS + title **JARVIS**). JS strips `(Open WebUI)` on the sidebar wordmark after expand; empty-state **jarvis-local** is HUD type; the **model picker stays stock**. Sidebar defaults collapsed (`localStorage`). Recreate once on ConfigMap change.
Audio click-ops: [open-webui-audio.md](open-webui-audio.md). RAG: [open-webui-knowledge.md](open-webui-knowledge.md). Briefing: [briefing.md](briefing.md) (`lab-docs`). Promoted facts: `scripts/remember.sh` → `jarvis-learned`.

## chat.lan HUD

Chrome is **not** a custom Open WebUI image. Flux mounts ConfigMap `jarvis-webui-hud`
(`clusters/jarvis/apps/jarvis-webui-hud.yaml`) and the container `command` runs
`/hud/inject-hud.sh`, which patches `/app/build/index.html` then `exec`s upstream `start.sh`.

- Generic CSS: `html/body/#app`, sidebar rail, 28px grid, vignette, slow heartbeat.
- JS (no `characterData` observer — that froze the tab): strip `(Open WebUI)`,
  mark the **JARVIS** text node, mark empty-state **jarvis-local** only (skip
  `button` / listbox so the model picker stays stock type), hide the version footer.
  `childList` observer re-applies after the sidebar is expanded.
- Default **collapsed** sidebar: `localStorage.sidebar=false` (per browser, not a cookie).
- Suggestions off: sqlite `ui.prompt_suggestions=[]`.
- Follow-ups off: sqlite `task.follow_up.enable=false` (YAML `ENABLE_FOLLOW_UP_GENERATION=false`
  loses to PersistentConfig until the db row is false).

After any Open WebUI **digest bump**: Recreate, `curl -sk https://chat.lan/ | grep jarvis-hud`,
glance chat.lan. Do not fork the image.
