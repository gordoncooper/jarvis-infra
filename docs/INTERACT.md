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

Picker whitelist + arena-off persist via `scripts/seed-webui-ui.sh` (sqlite). Rebuilds must run it after Open WebUI is up.

Chat memory: say **remember that ...** in chat.lan (alias `jarvis`). It appends `/cluster/local/openclaw/learned.md`; `seed-learned.sh` hourly copies into knowledge.

## Hands (OpenClaw)

Cluster actuator is **OpenClaw**, not the 7B, not nested Goose.

- Browser: http://agent.lan:18789 (pair once; HTTP; token on bastion).
- One turn from bastion: `./scripts/openclaw-ask.sh "using cluster-health, are nodes Ready?"`
- Goose stays operator-on-bastion (`ssh`/`kubectl` you run). Do not wrap Goose inside OpenClaw.
- chat.lan must not auto-invoke OpenClaw. Point sir at agent.lan or this script when a write/inspect-with-shell is needed.
- Skills in the pod: `cluster-health`, `cluster-metrics`, `lab-map` (readonly ClusterRole).
- Default output is assistant text. `OPENCLAW_ASK_JSON=1` dumps the gateway JSON.

## Dual door (locked)

- **chat.lan** — conversation, RAG, voice, router chip. The 7B has no shell.
- **OpenClaw** — cluster hands: http://agent.lan:18789 or `./scripts/openclaw-ask.sh "using cluster-health, are nodes Ready?"`
- **Goose** — you on the bastion only. Do not nest Goose inside OpenClaw or chat.lan.
- If chat.lan is asked to mutate or run kubectl: refuse and point at OpenClaw. Do not invent command output.

## jarvis-hands (in-glass, read-only)

Same chat.lan, model chip `jarvis-hands`. LiteLLM → OpenClaw `agent --message` via pod sidecar `:4001`.
ClusterRole is still **readonly**. Mutate later. Break-glass: http://agent.lan:18789

Route chip v10: LOCAL / HANDS / GROK-CODE. In-chat jarvis uses sidebar wordmark; picker stays stock.

## Voice chat (wake-word v0)

Pinned sidebar chat **Voice**, model **jarvis**. This is the dedicated voice session
(not whichever tab you were typing in).

1. https://chat.lan → open **Voice**.
2. Confirm model is `jarvis` (router). Headphones if Piper is on (Call mode hears the speakers).
3. Start **Call** / voice mode (phone icon). Talk; silence ends the turn; TTS replies; mic re-arms.
4. This is **not** `hey_jarvis`. Open WebUI cannot hear a wake word in a silent tab.
   Stock **hey_jarvis** is a later laptop listener (`openWakeWord`), not a cluster pod.

Idempotent create/pin: `./scripts/ensure-voice-chat.sh`

## Wake word v1 (laptop)

Stock **hey_jarvis** runs on the laptop, not in the cluster.

1. On bastion (already): `~/.config/jarvis-wake/env` (mode 600, JWT, not git).
2. On the laptop:
   `mkdir -p ~/.config/jarvis-wake`
   `scp agent@192.168.8.10:.config/jarvis-wake/env ~/.config/jarvis-wake/env`
   `scp agent@192.168.8.10:jarvis-infra/scripts/jarvis-wake.py ~/jarvis-wake.py`
   `scp agent@192.168.8.10:jarvis-infra/scripts/requirements-wake.txt ~/requirements-wake.txt`
   Ubuntu: `sudo apt-get install -y python3-venv portaudio19-dev ffmpeg`
   `python3 -m venv ~/.local/jarvis-wake && ~/.local/jarvis-wake/bin/pip install -r ~/requirements-wake.txt`
   `~/.local/jarvis-wake/bin/python ~/jarvis-wake.py`
3. Headphones. Say **hey jarvis**, then the question. Transcript + reply land in pinned **Voice**.
4. Call mode still works if you would rather click.

Do not run `jarvis-wake.py` as `agent` on the bastion (no mic).

Laptop listener is transport only (mic → Voice chat → speaker). It must not special-case questions.
Wall clock is one labeled `[clock …]` line from the OWUI filter on every chat.lan turn (America/Los_Angeles).
Cluster LIVE dump stays intent-gated. Do not add per-question injects on the laptop.

### Laptop listener commands

Handled on the laptop after STT. **Not sent to chat.lan.** Wake with hey jarvis, then:

| Command | Example phrases |
|---|---|
| stop | go away, that's all, jarvis stop, stand down, good night |
| pause | pause, stand by |
| resume | resume, I'm back, carry on |
| repeat | repeat, say that again |
| mute TTS | mute replies, text only |
| unmute TTS | unmute replies, speak again |
| status | status, are you listening |

`python3 ~/jarvis-wake.py --commands` prints the list. Ctrl-C still works.

## Router

Alias `jarvis` is LiteLLM `complexity_router`. **Direction:** replace exact-phrase `keyword_tier_rules` with `classifier_type: llm` (grok-4-fast, heuristic fallback). Chip shows the resolved model. Picker is the escape hatch. See [PLAN.md](PLAN.md).

Chat filter injects `[clock …]` + `learned.md` only. Live cluster numbers are Hands, not a regex dump.

## Routed model chip

chat.lan does not show a routed-model chip. Open WebUI rewrites every stream chunk to model=jarvis, so the child (ollama/jarvis vs jarvis-hands) never reaches the browser. Do not spend cycles on a HUD chip for this.

## Hands (chat.lan)

Default `jarvis` auto-routes live rack questions to `jarvis-hands` (OpenClaw read-only, ~20–40s). Picker hatch still there. Do not open agent.lan for this. Writes are not enabled.

## Hands writes (slice 1)

OpenClaw may `kubectl delete pod` and `kubectl rollout restart` (patch deployment) in **apps, inference, agents, monitoring** only.
It cannot touch secrets, kube-system, flux-system, or nodes. Do not ask it to edit git.
