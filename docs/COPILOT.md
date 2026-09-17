# COPILOT.md — cold-start for the next AI

You are the **JARVIS homelab copilot**, not an App Builder.
Do not scaffold an app. Do not use Vite, port 8080, a preview, or `render_file`.
The operator pastes command output from a bastion. You reply with scripts
they run as user **agent** (`HOME=/home/agent`). Never user `bastion`.

This file is the onboarding map. Do not treat it as live inventory.
**Live cluster wins.** GitHub can lag. `docs/history/` and `PHASE*` are frozen.

## Intent

The six-node k3s rack **is** JARVIS (Iron Man-style). Local-first: cheap 7B
for chatter/RAG; `jarvis-grok` / `jarvis-grok-code` when the job needs a
bigger brain (API cost). Lab only — no house/HA. LAN-only until Tailscale.
Voice is chat STT/TTS; wake-word later. Unified mouth + router: [`PLAN.md`](PLAN.md).

Character for the 7B: [`persona.txt`](persona.txt). Rack facts for the 7B:
[`briefing.md`](briefing.md). You (this copilot) are Grok in chat with the
operator; you are **not** the 7B.

## Authority (highest first)

1. Live cluster (`kubectl`, node SSH, NFS).
2. Gitea `http://git.lan/jarvis/cluster.git` — Flux origin. **Never** Flux → GitHub.
3. `~/jarvis-infra/VERSION` — `GIT_TAG`, `IMAGE`/`IMAGE_TAG`, `K3S` (independent).
4. [`OPERATING.md`](OPERATING.md) + [`REBUILD.md`](REBUILD.md) (procedure, **no pins**).
5. [`LESSONS.md`](LESSONS.md).
6. `docs/history/` — snapshots only.
7. GitHub `gordoncooper/jarvis-infra` (origin) and `jarvis-cluster` (**mirror**).

## Reading order

1. This file
2. [`PLAN.md`](PLAN.md) — north star (router / hands / RAG)
3. `VERSION` (bastion `~/jarvis-infra/VERSION` is canonical)
4. [`OPERATING.md`](OPERATING.md)
5. [`INTERACT.md`](INTERACT.md)
6. [`LESSONS.md`](LESSONS.md)
7. [`briefing.md`](briefing.md) + [`persona.txt`](persona.txt)
8. Task-specific: REBUILD, RESTORE, [`open-webui-knowledge.md`](open-webui-knowledge.md)
8. Cluster repo README — YAML only; scripts live here

Stop when the task is clear. Do not binge `PHASE*`.

## Cold start (before any cluster YAML change)

1. Operator’s first paste (below) plus this file.
2. Clone or pull GitHub **if they made it readable**. Do not assume the clone
   matches the bastion.
3. Ask them to run, as agent:

   `~/jarvis-infra/scripts/copilot-discover.sh`

4. Treat that paste as live. If git and live disagree, **live wins**.
5. Ask for extra `cat`/`ls`/`kubectl` **names-only** before editing YAML.

## Hard rules

- Quoted `bash << 'SCRIPT'`. No gzip+base64 YAML in chat. No tarball handoffs
  unless they ask.
- `ssh -n` **except** when stdin **is** the remote program (`ssh host python` + heredoc).
- Never retag (`git tag -f`). Next snapshot is a new `GIT_TAG`. Never copy pins
  into REBUILD/README.
- Do not bump the homepage **image** unless `https://home.lan/status` is wrong.
- Homepage: one image, `imagePullPolicy: Never`, apps-01, SA `homepage`
  (events + Flux + **pods** + **nodes**). Dockerfile `COPY output/` + srvx `--prod`.
  `install-jarvis-home.sh` tars only Dockerfile+output, **before** Flux.
  HUD: click tiles → dossier. `src/` is rebuild source; `output/` is the image.
- `agent.lan` DNS is **192.168.8.16**. `git.lan` stays HTTP. `agent.lan:18789` HTTP.
- Do not assign bash `UID` (readonly). Knowledge list API returns `{items:[]}`.
- Do not dump Secret `.data`, Helm release blobs, or `gotk-components.yaml`.
- Architecture READMEs keep full mermaid **in git**. Chat may summarize.
- Recreate Open WebUI → brief “no available server”; wait / hard refresh.
- Recycle OpenClaw → operator must **re-pair** http://agent.lan:18789.

## Two push paths

| Change | Bastion clone | Push |
| --- | --- | --- |
| Metal, docs, image, scripts, SOPS | `~/jarvis-infra` | GitHub `jarvis-infra` |
| Cluster YAML | `~/cluster` | **Gitea** `git.lan/jarvis/cluster.git` then Flux |

Then `scripts/mirror-to-github.sh`. Never point Flux at GitHub.

## Memory

| Layer | Store | Writer | Reader |
| --- | --- | --- | --- |
| Character | `persona.txt` → ConfigMap + model sqlite | git | chat system prompt |
| Briefing | `briefing.md` → knowledge **lab-docs** | git + `seed-lab-docs.sh` | chat RAG, Goose |
| Promoted facts | `learned.md` on apps-01 + NFS | OpenClaw / `remember.sh` | knowledge **jarvis-learned**, Goose |
| Private | OpenClaw `MEMORY.md` / dreams | OpenClaw | OpenClaw only |

Chat 7B **cannot write** (tools stripped). Do not commit `learned.md` to git.
Publish: `scripts/remember.sh <fact>` or hourly `seed-learned.sh`.

## Proof

~~
./scripts/copilot-discover.sh
./scripts/check-contract.sh
./scripts/verify-jarvis.sh
~~

## Paste this into a new Grok chat

~~
You are a JARVIS homelab copilot, not an App Builder. Do not scaffold an app.
Do not use Vite, port 8080, or a preview. I run Ubuntu on a bastion; I paste
command output; you reply with scripts I run as user agent (HOME=/home/agent).

Read docs/COPILOT.md in gordoncooper/jarvis-infra (I will make the GitHub
repos readable or paste files). Then ask me to run:
  ~/jarvis-infra/scripts/copilot-discover.sh
Live cluster is authoritative. Flux origin is http://git.lan/jarvis/cluster.git
— never GitHub. Pins live in ~/jarvis-infra/VERSION. Do not retag. Do not bump
the homepage image unless /status is wrong.

Repos: https://github.com/gordoncooper/jarvis-infra
       https://github.com/gordoncooper/jarvis-cluster  (mirror only)
~~

## chat.lan HUD

Source of truth: cluster `clusters/jarvis/apps/jarvis-webui-hud.yaml` +
`open-webui.yaml` volume/command. Live sqlite on apps-01
`/cluster/local/open-webui/webui.db` holds prompt chips and follow-up enable.
Homepage image tag is independent; do not bump it for WebUI CSS.

## Docs after every major step

Same commit as the change (or the next one if sqlite-only). Do not leave INTERACT /
OPERATING / LESSONS / COPILOT describing the previous UI or flag. History under
`docs/history/` stays frozen.

Minimum:
- Operator path → `docs/INTERACT.md`
- How we run the rack → `docs/OPERATING.md`
- Trap that burned us → `docs/LESSONS.md` (one row or bullet)
- Cold-start pointer → `docs/COPILOT.md` if a new discover command exists

Do not copy `GIT_TAG` / `IMAGE` into REBUILD.md. Do not bump the homepage image
for chat.lan CSS.

Hands: OpenClaw at http://agent.lan:18789 or `./scripts/openclaw-ask.sh "…"`. Do not nest Goose. chat.lan does not auto-run kubectl.

Hands locked: dual door. chat.lan talks; OpenClaw (agent.lan / openclaw-ask.sh) has exec; Goose is bastion-only. No chat.lan inbox/auto-kubectl.

Hands in-glass: LiteLLM `jarvis-hands` → OpenClaw shim :4001 (readonly RBAC). agent.lan / openclaw-ask.sh is break-glass. No inbox. Writes = later RBAC.

## Glass (see docs/PLAN.md)

Default model `jarvis`. Chip = resolved backend. Do not add exact-phrase router rules.
- SIMPLE: talk / inventory → jarvis-local (7B).
- COMPLEX: live inspect → jarvis-hands (OpenClaw readonly).
- REASONING: yaml / flux / patch → jarvis-grok-code.
- SYSTEM: `cluster/clusters/jarvis/apps/jarvis-system-prompt.txt`.
- Next: PLAN remaining (subtract LIVE regex, then LLM classifier routing). Not per-question hacks.

Wake-word v0: `./scripts/ensure-voice-chat.sh` pins OWUI chat **Voice**. Call mode is Chrome-only; `hey_jarvis` is not in-cluster.

Wake-word v1 is **laptop-only** (`scripts/jarvis-wake.py`). Env is `~/.config/jarvis-wake/env` (not git). Never print the token.

- chat.lan does not show a routed-model chip. Open WebUI rewrites every stream chunk to model=jarvis, so the child (ollama/jarvis vs jarvis-hands) never reaches the browser. Do not spend cycles on a HUD chip for this.
- Dual route: LiteLLM complexity_router on alias `jarvis` (automatic). OWUI filter `jarvis_route` is prefix override only. Never fold keywords into the filter or prefixes into keyword_tier_rules.

## Persona

`docs/persona.txt` only. 7B = Ollama SYSTEM. Grok = `jarvis_persona` filter. Env `DEFAULT_SYSTEM_PROMPT` is not the spine.
