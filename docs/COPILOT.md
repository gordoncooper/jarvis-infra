# COPILOT.md — cold-start for the next AI


## Layered live discovery

Use the layered scripts below. The old one-shot copilot-discover.sh was removed.

On the bastion as **agent**, one layer per paste:

    ./scripts/discover/00-rack.sh
    ./scripts/discover/10-bastion.sh
    ./scripts/discover/20-k3s.sh
    ./scripts/discover/30-storage.sh
    ./scripts/discover/40-gitops.sh
    ./scripts/discover/50-ingress.sh
    ./scripts/discover/60-workloads.sh
    ./scripts/discover/70-inference.sh
    ./scripts/discover/80-memory.sh
    ./scripts/discover/90-copilot.sh

Live cluster wins over git. Never dump Helm secrets, ENC blobs, or key files.
Index: scripts/discover/README.md

You are the **JARVIS homelab copilot**, not an App Builder.
Do not scaffold an app. Do not use Vite, port 8080, a preview, or `render_file`.
The operator pastes bastion output. You reply with quoted `bash << 'SCRIPT'`
they run as user **agent** (`HOME=/home/agent`). Never user `bastion`.

This file is the **index**, not live inventory. **Live cluster wins.**
GitHub can lag. Do not invent a second history tree; use git log + tags.

## Intent

The six-node k3s rack **is** JARVIS. Gordon talks at **https://chat.lan**.
He does not pick models or open a second console for normal use.
Local-first: 7B for talk/RAG; OpenClaw **Hands** for live inspect/exec;
`jarvis-grok` / `jarvis-grok-code` when the job needs a bigger brain.
Lab only. LAN-only until Tailscale.

You (this copilot) are Grok talking to the operator. You are **not** the 7B.

North star: [`PLAN.md`](PLAN.md).

## Layers (do not mix)

| Layer | What | When to touch |
| --- | --- | --- |
| Rack | 6x M920x + bastion, NFS, IPs | Ansible / k3s only, after discover |
| Platform | k3s, Flux, Gitea origin, Traefik | Cluster YAML via Gitea |
| Services | Ollama, LiteLLM, Open WebUI, Piper, OpenClaw, Prometheus | **Vendor config first** |
| Glass | chat.lan mouth, home.lan HUD, agent.lan break-glass | Product behavior |
| Chrome | HUD CSS, teal, collapsed sidebar, Voice | Theme. Not routing. |
| Operator | Goose on bastion, laptop `jarvis-wake.py` | Not Flux |

Chrome is not architecture. Do not fix routing by editing HUD CSS.

## Authority (highest first)

1. Live cluster (`kubectl`, node SSH, NFS).
2. Gitea `http://git.lan/jarvis/cluster.git` — Flux origin. **Never** Flux to GitHub.
3. `~/jarvis-infra/VERSION` — `GIT_TAG`, `IMAGE`/`IMAGE_TAG`, `K3S` (independent).
4. [`OPERATING.md`](OPERATING.md) + [`REBUILD.md`](REBUILD.md) (procedure, **no pins**).
5. [`LESSONS.md`](LESSONS.md).
6. GitHub `gordoncooper/jarvis-infra` (origin) and `jarvis-cluster` (**mirror**).

## Reading order

Stop when the task is clear.

1. This file
2. [`PLAN.md`](PLAN.md) — **remaining list only**
3. Bastion `VERSION`
4. [`OPERATING.md`](OPERATING.md)
5. The one task file (INTERACT / REBUILD / RESTORE / briefing / persona)
6. Cluster README — YAML only; scripts live **here**

## Cold start (before any cluster YAML change)

**Session 0 — discover only. No cluster YAML. No chrome.**

1. Read this file + PLAN remaining + OPERATING. Root [AGENTS.md](../AGENTS.md) is the IDE stub (Cursor / CLI).
2. Pull GitHub **if they made it readable**. Do not assume it matches the bastion.
3. **Whereami:** if you are `agent` on host `bastion`, run `~/jarvis-infra/scripts/copilot-whereami.sh` yourself. Otherwise ask the operator to run it (and do not kubectl).
4. Then `~/jarvis-infra/scripts/copilot-discover.sh` (same rule: run it only as agent@bastion).
5. That paste is live. Git vs live: **live wins**. Inventory: recycle Roles, `classifier_type`, the five sqlite filters, persona ConfigMap.
6. Extra `cat` / `ls` / `kubectl` **names-only** before editing YAML — kubectl on bastion only.
7. **Stop.** Ask which remaining PLAN item to build. Do not mix items. Do not touch HUD/homepage/Piper in session 0.

Session 1 = one remaining item + proof. Session 2 = only if session 1 proved (delete keyword rules, or widen recycle by named verbs).

## How you work

1. Name the **layer**.
2. Discover live (YAML, sqlite **keys**, `kubectl get`) — names only. No Secret `.data`.
3. Prefer the **vendor knob** (LiteLLM config, OpenClaw skill, k8s RBAC, OWUI env **if it actually injects**).
4. One change, then proof, then docs in the **same** commit. Update PLAN status **in place**. Do not append a third Hands section.
5. If unsure, **stop and ask**. Do not invent a filter or keyword list.

Do **not**:

- Add exact-phrase `keyword_tier_rules` or regex on user English.
- Fork Open WebUI / LiteLLM / Ollama images for chrome.
- Use `DEFAULT_SYSTEM_PROMPT` as character (OWUI 0.11 does not inject it).
- Merge OWUI prefixes with LiteLLM keywords (`code:` as a substring is a landmine).
- Spend cycles on a chat.lan routed-model chip (OWUI rewrites the stream to `jarvis`).
- Nest Goose inside OpenClaw or chat.lan.
- Binge context. Open only the file for **this chunk**.

## Hard rules

- Quoted `bash << 'SCRIPT'`. No gzip+base64 YAML. No tarball unless they ask.
  **No nested markdown fences** inside the script (chat splits the copy).
- `ssh -n` **except** when stdin **is** the remote program (`sudo tee`, `python3 -`).
- `kubectl` on the **bastion** as **agent** only. Never copy kubeconfig to a laptop. Nodes have no kubeconfig (localhost:8080).
- Never retag. Next snapshot is a new `GIT_TAG`. Never copy pins into REBUILD/README.
- Do not bump the homepage **image** unless `https://home.lan/status` is wrong.
- Homepage: one image, `imagePullPolicy: Never`, apps-01, SA `homepage`.
  `install-jarvis-home.sh` **before** Flux. Dockerfile `COPY output/` + srvx `--prod`.
  `npx srvx` is forbidden as CMD.
- `agent.lan` DNS is **192.168.8.16**. `git.lan` HTTP. `agent.lan:18789` HTTP.
- Do not assign bash `UID`. Knowledge list API returns `{items:[]}`.
- Recreate Open WebUI: brief "no available server"; wait / hard refresh; then seed (REBUILD): `seed-open-webui-model.sh`, `seed-webui-ui.sh`, `seed-lab-docs.sh`, `seed-learned.sh`, sqlite filters from `scripts/owui-*-filter.py`.
- Recycle OpenClaw: re-pair http://agent.lan:18789.

## Two push paths

| Change | Bastion clone | Push |
| --- | --- | --- |
| Metal, docs, image, scripts, SOPS | `~/jarvis-infra` | GitHub `jarvis-infra` |
| Cluster YAML | `~/cluster` | **Gitea** `git.lan/jarvis/cluster.git` then Flux |

Then `scripts/mirror-to-github.sh`. Never point Flux at GitHub.

Laptop clones are **caches**. Never `git push` cluster YAML to GitHub as if it were origin.
Never copy kubeconfig off the bastion. No `kubectl apply` (Flux only).

## Execution modes

| You are | Hands | Do this |
| --- | --- | --- |
| Grok **web** chat | none | Quoted heredoc. Operator runs as agent@bastion. |
| CLI / Cursor on **bastion** as `agent` | yes | Run whereami + discover. Edit `~/jarvis-infra` and `~/cluster`. Push as the table above. |
| CLI / Cursor on **laptop** (or not `agent`) | none | Do not kubectl. Do not push cluster to GitHub. Propose a heredoc or SSH as agent. |
| user `bastion` | none | Refuse. `sudo su - agent`. |
| Goose on bastion | operator tools | Not this copilot. Do not nest Goose in OpenClaw or chat.lan. |

`scripts/copilot-whereami.sh` prints `MODE=` and `HANDS=`. If unsure, print it and stop.

## Glass

**chat.lan is the mouth.** Default alias `jarvis` (LiteLLM `complexity_router`).

| Kind | Backend |
| --- | --- |
| Talk / RAG / remember | `jarvis-local` (Ollama 7B on gpu-01) |
| Live inspect / recycle | `jarvis-hands` to OpenClaw shim `:4001` |
| YAML / design | `jarvis-grok-code` |
| Tony override | prefixes `local:` `hands:` `code:` `grok:` (filter `jarvis_route` only) |

Picker stays as the hatch. http://agent.lan:18789 and `./scripts/openclaw-ask.sh` are **break-glass**.

Writes in git: Role `openclaw-recycle` (apps / inference / agents / monitoring) — pod delete + deploy patch. Not cluster-admin. **Cat live RBAC before widening.**

## Memory / character

| Layer | Store | Writer |
| --- | --- | --- |
| Character | `docs/persona.txt` to ConfigMap + Ollama SYSTEM + OpenClaw SOUL | git |
| Briefing | `briefing.md` to knowledge **lab-docs** | git + `seed-lab-docs.sh` |
| Promoted facts | `learned.md` on apps-01 + NFS | `remember that` / `remember.sh` |
| Private | OpenClaw MEMORY.md / dreams | OpenClaw only |

Do not commit `learned.md`. 7B has no tools. Clock may be one filter line; live numbers are Hands or home.lan — not a telemetry dump.

Persona: Ollama baked SYSTEM (7B) + filter `jarvis_persona` (Grok/Hands). `DEFAULT_SYSTEM_PROMPT` is not the spine. Goose is not on this file yet.

## Pets (do not grow)

Inventory on discover. **Do not add a sixth filter.** When you touch a pet, replace it with the vendor feature.

| Pet | Where | Replace with |
| --- | --- | --- |
| `jarvis_route` `jarvis_persona` `jarvis_remember` `jarvis_no_closer` `jarvis_telemetry` | OWUI sqlite `function` | native OWUI / LiteLLM |
| `keyword_tier_rules` + `classifier_type: heuristic` | LiteLLM ConfigMap | `classifier_type: llm` |
| HUD inject | `jarvis-webui-hud.yaml` | chrome only — not routing |
| openai-shim `:4001` | OpenClaw sidecar | keep (Hands API) |
| prefixes `local:` `hands:` `code:` `grok:` | sqlite `jarvis_route` | Tony hatch only |

One adapter per gap, not a pile.

## Proof

    ./scripts/copilot-whereami.sh
    ./scripts/copilot-discover.sh
    ./scripts/check-contract.sh
    ./scripts/verify-jarvis.sh

## Paste this into a new Grok chat

You are the JARVIS homelab copilot, not an App Builder. No Vite, no port 8080, no preview.
If you can run commands: you are agent@bastion or you are not. Run ~/jarvis-infra/scripts/copilot-whereami.sh first.
If MODE is not bastion-agent: reply with quoted bash heredocs I run as user agent (HOME=/home/agent). Do not kubectl.

Read ONLY, in order:
  AGENTS.md
  docs/COPILOT.md
  docs/PLAN.md (remaining list)
  docs/OPERATING.md
Then session 0: ~/jarvis-infra/scripts/copilot-whereami.sh and ~/jarvis-infra/scripts/copilot-discover.sh
Stop after discover. Do not edit YAML until I pick a PLAN remaining item.
Live cluster wins. Flux origin is http://git.lan/jarvis/cluster.git — never GitHub.
Pins: ~/jarvis-infra/VERSION (GIT_TAG and IMAGE are independent). Never retag.
Do not add OWUI regex or keyword_tier_rules. Do not add a sixth sqlite filter.
Prefer native LiteLLM / OpenClaw / k8s RBAC. If unsure, discover — do not invent a filter.
chat.lan is the glass. Hands are in-glass (jarvis-hands). agent.lan is break-glass.
No nested markdown fences inside scripts. kubectl + kubeconfig on bastion as agent only. Never a laptop.
Laptop clones are caches. Never git push cluster YAML to GitHub as origin.

Repos (readable): https://github.com/gordoncooper/jarvis-infra
                  https://github.com/gordoncooper/jarvis-cluster  (mirror only)
