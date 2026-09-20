# How to talk to JARVIS

Operator/copilot contract: [OPERATING.md](OPERATING.md). Pins: `~/jarvis-infra/VERSION`.
Proof: `~/jarvis-infra/scripts/verify-jarvis.sh`.

Product surface is **jarvis.lan** and the operator surface is **noc.lan** (D-0002).
Everything else below is break-glass or vendor UI. `home.lan` is being retired
into `noc.lan`; it still serves today, so it is listed as legacy, not as the board.

| Surface | URL / cmd | Best for | Model / cost |
| --- | --- | --- | --- |
| **Product** | https://jarvis.lan | Talking to JARVIS. The glass. | — |
| **NOC** | https://noc.lan | Nodes, workloads, alerts. Renders when the brain is down. | — |
| Legacy board | https://home.lan | Services + rack + events, click-tile dossiers. Retiring into noc.lan. | — |
| Legacy telemetry | https://home.lan/api/telemetry | JSON: source, GPUs, events, `podsByNode` | — |
| Chat (break-glass) | https://chat.lan | Q&A, RAG, voice when the glass is down | `jarvis-local` free; `jarvis-grok*` SuperGrok |
| Agent (break-glass) | http://agent.lan:18789 | Cluster ops, files, live metrics | `jarvis-grok-code` (API) |
| Cursor | Remote-SSH as `agent` | Architecture, decisions, cross-repo work | Whatever model this window is | 
| Claude Code | `claude` on bastion | Bulk implementation in one repo | Subscription; long runs are cheap |
| Grok CLI | `grok` on bastion | Short edits, headless checks | `grok-4.6` in `~/.grok/config.toml`; metered `XAI_API_KEY` |
| Goose | `goose session` on bastion | On-node SSH, cheap loops | Profile-switched: `llm-lan` (free) or `xai` (`grok-build-0.1`, metered). **Never jarvis-local** — the 7B invents shell output. |
| Grafana | https://grafana.lan | Graphs (NVIDIA 14574) | — |
| API | https://llm.lan/v1 | Anything OpenAI-shaped | LiteLLM |
| GitOps | http://git.lan | YAML in `~/cluster` as **agent** | — |
| SSH | `ssh bastion` -> nodes | Normal operator access; last glass if k3s is gone | — |

**git.lan stays HTTP** (Flux). **agent.lan:18789** is HTTP on purpose (hostPort).
Re-pair OpenClaw after its pod recycles. DNS for agent.lan is **192.168.8.16**.

Default path (target): one alias **`jarvis`** — LiteLLM routes. Picker stays as Gordon's
override. chat.lan does **not** show a model chip — Open WebUI rewrites the stream to
`jarvis`, so the child model never reaches the browser. Do not build one.
North star: [VISION.md](VISION.md).


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

## Hands (in-glass)

Cluster actuator is **OpenClaw**, reached from chat.lan as LiteLLM model `jarvis-hands`
(OpenAI shim in the OpenClaw pod, port 4001). Default alias `jarvis` routes live rack
questions here. Do not open http://agent.lan:18789 for normal inspect.

- Break-glass UI: http://agent.lan:18789 (re-pair after pod recycle; HTTP; DNS **192.168.8.16**).
- Break-glass CLI: `./scripts/openclaw-ask.sh "using cluster-health, are nodes Ready?"`
- Goose stays operator-on-bastion. Do not nest Goose inside OpenClaw.
- Skills: `cluster-health`, `cluster-metrics`, `lab-map`.
- Writes **slice 1** (git): Role `openclaw-recycle` in apps, inference, agents, monitoring
  — delete pods, patch deployments. No secrets, no kube-system, no Flux, no git edits.
- Prefixes (start of message; OWUI `jarvis_route` only): `local:` 7B, `hands:` OpenClaw,
  `code:` grok-code, `grok:` grok-4-fast. Slash form too. `code:`/`grok:` skip RAG.
  Do not put prefixes in LiteLLM `keyword_tier_rules`.

## Voice chat (break-glass on chat.lan)

Pinned sidebar chat **Voice**, model **jarvis**. Dedicated OWUI Call session when
the product glass is down — **not** the `hey_jarvis` laptop path.

1. Open https://chat.lan → **Voice**.
2. Confirm model is `jarvis` (router). Use headphones if Piper is on.
3. Start **Call** / voice mode (phone icon). Talk; silence ends the turn; TTS replies.

Idempotent create/pin: `./scripts/ensure-voice-chat.sh`

Open WebUI cannot hear a wake word in a silent tab. For **hey jarvis**, use the
laptop listener below.

## Wake word (laptop → jarvis.lan)

Stock **hey_jarvis** via openWakeWord on the laptop. Transport only: mic →
https://jarvis.lan (`/v1/stt`, `/v1/turns`, `/v1/tts`) → speaker (D-0014).
Not `chat.lan` / OWUI. Do not run this as `agent` on the bastion (no mic).

### One-time setup (laptop)

Bastion already has `~/.config/jarvis-wake/env` (`ORCH_URL=https://jarvis.lan`,
mode 600, not git). Example: `scripts/jarvis-wake.env.example`.

```bash
# packages
sudo apt-get install -y python3-venv portaudio19-dev ffmpeg

# files from bastion
mkdir -p ~/.config/jarvis-wake
scp agent@192.168.8.10:.config/jarvis-wake/env ~/.config/jarvis-wake/env
scp agent@192.168.8.10:jarvis-infra/scripts/jarvis-wake.py ~/jarvis-wake.py
scp agent@192.168.8.10:jarvis-infra/scripts/requirements-wake.txt ~/requirements-wake.txt

# venv
python3 -m venv ~/.local/jarvis-wake
~/.local/jarvis-wake/bin/pip install -r ~/requirements-wake.txt
```

### Refresh script / env from bastion

```bash
scp agent@192.168.8.10:jarvis-infra/scripts/jarvis-wake.py ~/jarvis-wake.py
scp agent@192.168.8.10:.config/jarvis-wake/env ~/.config/jarvis-wake/env
```

Optional knobs in `env` (defaults shown in `scripts/jarvis-wake.env.example`):
`WAKE_THR`, `WAKE_HITS`, `SILENCE_SEC`, `MIN_UTTER`, `MAX_UTTER`, `COOLDOWN_SEC`,
`VERIFY_TLS`, `MIC_DEVICE`.

### Doctor

```bash
~/.local/jarvis-wake/bin/python ~/jarvis-wake.py --doctor
~/.local/jarvis-wake/bin/python ~/jarvis-wake.py --list-devices
```

### Run

```bash
~/.local/jarvis-wake/bin/python ~/jarvis-wake.py
```

Headphones on (Piper can re-trigger the wake word; `COOLDOWN_SEC` helps). Say
**hey jarvis**, then the question. Glass PTT on https://jarvis.lan still works
if you would rather click.

The listener forces CPU for onnxruntime. Short junk transcripts (`you`, `uh`)
are dropped; leading “hey jarvis” is stripped from STT.

Local UX commands stay on the client after STT. Live numbers are Hands or
home.lan — do not add per-question injects on the laptop.

### Laptop listener commands

Handled after STT. **Not sent to the orchestrator.** Wake, then say one of:

| Command | Example phrases |
| --- | --- |
| stop | go away, that's all, jarvis stop, stand down, good night |
| pause | pause, stand by |
| resume | resume, I'm back, carry on |
| repeat | repeat, say that again |
| mute TTS | mute replies, text only |
| unmute TTS | unmute replies, speak again |
| status | status, are you listening |

```bash
~/.local/jarvis-wake/bin/python ~/jarvis-wake.py --commands
```

Ctrl-C also stops the listener.

## Router

Alias `jarvis` is LiteLLM `complexity_router`. For its current configuration, ask
LiteLLM — `scripts/discover/apps/litellm.sh`. Do not trust a doc for router state.
**Direction:** native `classifier_type: llm` — see [VISION.md](VISION.md) and BACKLOG.
Picker is Gordon's hatch. chat.lan does **not** show a child-model chip (OWUI rewrites
the stream to `jarvis`). Do not spend cycles on one.

Telemetry filter: `[clock ...]` only if present. Live numbers = Hands or home.lan.
learned.md is RAG + `remember that`, not every prompt.

## Persona (chat.lan)

Source: `docs/persona.txt` (ConfigMap `jarvis-persona` / OpenClaw `SOUL.md`).
7B: Ollama model `jarvis` SYSTEM. Grok/Hands: filter `jarvis_persona`.
Do not use `DEFAULT_SYSTEM_PROMPT` for this.

## Copilot

Layered live dump: `./scripts/discover/00-rack.sh` through `90-copilot.sh`; index in
[`../scripts/discover/README.md`](../scripts/discover/README.md). Contract: [`../AGENTS.md`](../AGENTS.md).
