# JARVIS north star (locked)

Git tag and image tag are independent. Pins live in `VERSION`.
Live cluster is truth. Flux origin is Gitea (`http://git.lan/jarvis/cluster.git`).

## Product

**chat.lan is the glass.** Tony does not pick models, open a second console, or teach the house the same fact twice.

- Talk / RAG / voice: LiteLLM alias `jarvis`.
- **Do** (real inspect/exec): `jarvis-hands` → OpenClaw via in-pod OpenAI shim (readonly ClusterRole today).
- Break-glass only: http://agent.lan:18789 and `./scripts/openclaw-ask.sh`.
- Goose: operator on the bastion only. Never nested.
- gpu-02: embed-only.
- Picker stays as an escape hatch. Chip shows the **resolved** backend.

## What “awesome” means

He talks. The house inspects itself when that is the question, stays quiet when it is not, and does not invent a clock or a GPU number.

## Principles

1. Always-on tiny context, **or** a tool — never intent regex. Clock is the template. Keyword LIVE dumps are not.
2. One source per fact. Persona = `docs/persona.txt`. Rack = `docs/briefing.md`. Memory = `learned.md`. Live numbers = `/api/telemetry` or Hands.
3. Broad intelligence in the **router**, not famous phrases in git.
4. The 7B does not get tools (it fake-called them). Live questions leave the 7B.
5. Filters are **verbs Gordon said** (`remember that`), not topics (`gpu`).
6. OWUI sqlite is a cache. After recreate, one seed job. Flux env is not gospel.
7. Structural cleanup is allowed. Per-question special cases are not.
8. Do not replace Open WebUI, the 7B, or the glass. Use APIs we already have.

## Routing (locked direction)

Today: `auto_router/complexity_router` + long `keyword_tier_rules`. Exact phrases (`are nodes ready` vs `are the nodes up`) are a bad operator experience.

**Target (native LiteLLM, no new product):** `classifier_type: llm` with a JARVIS rubric.

| Tier | Model | Meaning |
|---|---|---|
| SIMPLE / MEDIUM | `jarvis-local` | Talk, inventory, remembered facts, small talk |
| COMPLEX | `jarvis-hands` | Live cluster inspect (nodes, pods, VRAM, kubectl get/describe) |
| REASONING | `jarvis-grok-code` | YAML, Flux, patches, design, mutations (writes still RBAC-blocked) |

- **Classifier:** `jarvis-grok` (grok-4-fast), `timeout_ms` ~2000, `classifier_fallback: heuristic`. Not the 7B (same GPU, same failure mode). Not grok-code (too expensive to classify “hi”).
- Custom `classifier_llm_config.system_prompt` = talk vs live-inspect vs design/mutate. Rubric in git next to the LiteLLM config.
- After the classifier proves: **delete famous-phrase `keyword_tier_rules`.** Keep at most a tiny safety net or none.
- `return_raw_model_name: true` stays (chip). `session_affinity: false` stays.
- Do **not** add `semantic_keyword_matching` as the primary brain (still a phrase list). Embed on gpu-02 stays RAG, not the router.
- Heuristic scorer is fallback only, not the happy path.

Prove with: “hi” → local; “what is a GPU?” → local; “what’s GPU VRAM on gpu-01?” → hands; “are the nodes up?” → hands; “write a Flux kustomization” → grok-code.

## Memory

- `learned.md` is the writable notebook (NFS + apps-01). Always attach the file (it is small).
- lab-docs / briefing = git rack facts. Seed is best-effort. Do not pager on OWUI “duplicate content”.
- OpenClaw MEMORY.md / dreams stay private to OpenClaw.

## Live stats

- home.lan `/api/telemetry` is the modular backend (HUD already uses it).
- Do **not** paste Prometheus into the 7B prompt.
- Chat live numbers go through Hands (cluster-health / a small telemetry skill). Same API, no new daemon.

## Voice

- Piper GB male (`alloy`) in Flux.
- Laptop `jarvis-wake.py` is **transport** + local listener commands. No per-question injects on the laptop.
- Silence / systemd / CUDA warning = deferred polish.

## Copilot rules (changed)

Keep: live > Gitea > VERSION; independent git/image tags; never retag; agent not bastion; Flux never GitHub; no homepage bump unless `/status` is wrong; no tarball unless asked.

**Drop:** absolute “glass freeze / never retune keywords.”

**Add:** no new exact-phrase PRs; no new persona copies; no new OpenClaw wrappers; no intent-gated LIVE dumps; if the 7B must not hallucinate a number, do not put that number in its prompt.

## Remaining (locked order)

1. **Subtract LIVE regex.** Telemetry filter keeps `[clock …]` only. 7B stops reciting the rack unasked.
2. **LLM classifier routing.** Enable `classifier_type: llm` + rubric; prove the five prompts above; then delete `keyword_tier_rules`.
3. **One prompt spine.** `persona.txt` is the only character file; seed sqlite from it. One idempotent OWUI seed after rollouts.
4. **Later — OpenClaw writes.** Widen ClusterRole + approvals. Same shim.
5. **Later — Tailscale / off-LAN.**

## Done

- Alias `jarvis`, chip, picker, embed/arena hidden, native FC off.
- Piper GB, Voice chat, laptop hey_jarvis + local commands (v0.4.31).
- Hands in-glass readonly.
- `learned.md` + remember verb.
- HUD CSS (ConfigMap). Homepage image still v0.4.9.

## Deferred polish (not north-star)

- Adaptive silence RMS floor (some utts hit ~8s).
- Laptop `systemd --user` unit for hey_jarvis.
- Hide openWakeWord CUDA warning.

## Freeze (do not break)

- Pins: `VERSION` only. Image still `docker.io/library/jarvis-home:v0.4.9`.
- OpenClaw timeout 180. Shim ASK_TIMEOUT 180. LiteLLM hands timeout 240.
- Canary **blue-banana-42** (briefing). silver-orbit-3 is learned.md, not the secret phrase.
- New chat after SYSTEM/filter/router changes.

### Dropped: chat.lan route chip

chat.lan does not show a routed-model chip. Open WebUI rewrites every stream chunk to model=jarvis, so the child (ollama/jarvis vs jarvis-hands) never reaches the browser. Do not spend cycles on a HUD chip for this.

## Status (2026-09-16)

- Glass: chat.lan. Default model `jarvis` (LiteLLM complexity_router).
- SIMPLE → `jarvis-local` (Qwen 7B). COMPLEX live rack → `jarvis-hands` (OpenClaw, read-only). REASONING mutate/code → `jarvis-grok-code`.
- Hands in-glass: OpenClaw sidecar openai-shim :4001. Proven: default `jarvis` + picker `jarvis-hands` both return 6 Ready nodes. No extra panel. No inbox.
- Route chip: abandoned (OWUI rewrites stream model to `jarvis`).
- Writes slice 1: OpenClaw may delete pods + patch deployments in apps/inference/agents/monitoring only. No secrets, no kube-system, no Flux. Wake-word / Tailscale: later. gpu-02 embed-only.
- RBAC: Role `openclaw-recycle` (pod delete, deploy patch) in four app namespaces.
