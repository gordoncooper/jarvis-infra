# JARVIS north star

Git tag and image tag are independent. Pins live in `VERSION`.
Live cluster is truth. Flux origin is Gitea (`http://git.lan/jarvis/cluster.git`).

## Product

**chat.lan is the glass.** Tony does not pick models, open a second console, or teach the house the same fact twice.

- Talk / RAG / voice: LiteLLM alias `jarvis`.
- **Do** (inspect / recycle): `jarvis-hands` to OpenClaw in-pod OpenAI shim `:4001`.
- Break-glass only: http://agent.lan:18789 and `./scripts/openclaw-ask.sh`.
- Goose: operator on the bastion only. Never nested.
- gpu-02: embed-only.
- Picker stays as an escape hatch.
- chat.lan does **not** show a resolved-model chip (OWUI rewrites the stream to `jarvis`). Do not build one.

## What "awesome" means

He talks. The house inspects itself when that is the question, stays quiet when it is not, and does not invent a clock or a GPU number.

## Principles

1. Always-on tiny context, **or** a tool — never intent regex on English. Clock is the template. Keyword LIVE dumps are not.
2. One source per fact. Persona = `docs/persona.txt`. Rack = `docs/briefing.md`. Memory = `learned.md`. Live numbers = `/api/telemetry` or Hands.
3. Broad intelligence in the **router**, not famous phrases in git.
4. The 7B does not get tools (it fake-called them). Live questions leave the 7B.
5. Filters are **verbs Gordon said** (`remember that`), not topics (`gpu`).
6. OWUI sqlite is a cache. After recreate, one seed job. Flux env is not gospel.
7. Structural cleanup is allowed. Per-question special cases are not.
8. Do not replace Open WebUI, the 7B, or the glass. Use APIs we already have.
9. Prefer native LiteLLM / OpenClaw / k8s RBAC. One adapter per gap. Do not grow the filter pile.

## Routing (locked direction)

Today: `auto_router/complexity_router` + `keyword_tier_rules` + heuristic (`classifier_type: heuristic`).

**Target (native LiteLLM, no new product):** `classifier_type: llm` with a JARVIS rubric.

| Tier | Model | Meaning |
| --- | --- | --- |
| SIMPLE / MEDIUM | `jarvis-local` | Talk, inventory, remembered facts |
| COMPLEX | `jarvis-hands` | Live cluster inspect / recycle |
| REASONING | `jarvis-grok-code` | YAML, Flux, patches, design |

- Classifier: `jarvis-grok` (grok-4-fast), `timeout_ms` ~2000, `classifier_fallback: heuristic`. Not the 7B. Not grok-code for "hi".
- After it proves: **delete famous-phrase `keyword_tier_rules`.**
- `return_raw_model_name: true` stays. `session_affinity: false` stays.
- Do **not** add `semantic_keyword_matching` as the primary brain. gpu-02 embed stays RAG.
- Prefixes `local:` / `hands:` / `code:` / `grok:` are OWUI override only. Do not put them in LiteLLM keywords.

Prove with: "hi" to local; "what is a GPU?" to local; "what's GPU VRAM on gpu-01?" to hands; "are the nodes up?" to hands; "write a Flux kustomization" to grok-code.

## Memory

- `learned.md` is the writable notebook (NFS + apps-01).
- lab-docs / briefing = git rack facts. Seed is best-effort. Duplicate-content 400 is success.
- OpenClaw MEMORY.md / dreams stay private to OpenClaw.

## Live stats

- home.lan `/api/telemetry` is the modular backend (HUD already uses it).
- Do **not** paste Prometheus into the 7B prompt.
- Chat live numbers go through Hands.

## Voice

- Piper GB male (`alloy`) in Flux.
- Laptop `jarvis-wake.py` is **transport**. No per-question injects on the laptop.

## Copilot rules

Keep: live > Gitea > VERSION; independent git/image tags; never retag; agent not bastion; Flux never GitHub; no homepage bump unless `/status` is wrong; no tarball unless asked.

**Drop:** "frozen glass / never retune"; "chat.lan must not call OpenClaw"; "chip must show the child model".

**Add:** no new exact-phrase PRs; no new persona copies; no new OpenClaw wrappers; if the 7B must not hallucinate a number, do not put that number in its prompt.

## Remaining (locked order)

Do **not** mix these in one session. HUD CSS is not on this list.

1. **Discover live** — RBAC, filters, LiteLLM `classifier_type`, persona copies. Git vs live: live wins.
2. **Hands writes (next allow-list)** — Role `openclaw-recycle` is **already in git** (pod delete + deploy patch in apps/inference/agents/monitoring). Do not re-implement slice 1. Widen only with an explicit allow-list from the operator. Same shim. No cluster-admin. No new panel.
3. **LiteLLM LLM classifier** — `classifier_type: llm` + rubric; prove the five prompts; then delete famous-phrase `keyword_tier_rules`.
4. **One prompt spine** — `docs/persona.txt` only. Flux copy: ConfigMap `jarvis-persona` (`system.txt`). Ollama bake reads persona.txt (`create-jarvis-ollama.sh`). Filter `jarvis_persona` covers Grok. Goose copy still optional polish. Duplicate `jarvis-system-prompt.txt` removed.
5. **Parked** — wake-word polish, Tailscale, spend ceiling. gpu-02 stays embed-only.

## Done (do not redo)

- Alias `jarvis`, picker, embed/arena hidden, native FC off.
- Piper GB, Voice chat, laptop hey_jarvis (transport).
- Hands **in-glass** via openai-shim `:4001`.
- Slice 1 writes **in YAML**: `openclaw-recycle` (confirm live on discover).
- `learned.md` + `remember that`.
- HUD CSS ConfigMap. Homepage image still `docker.io/library/jarvis-home:v0.4.9`.
- Persona spine 2026-09-17: 7B bake + Grok inlet; OpenClaw SOUL matches `persona.txt`.

## Freeze (do not break)

- Pins: `VERSION` only.
- OpenClaw timeout 180. Shim ASK_TIMEOUT 180. LiteLLM hands timeout >=240.
- Canary **blue-banana-42** (briefing). `silver-orbit-3` is learned.md, not the secret phrase.
- New chat after SYSTEM / filter / router changes.

## Status 2026-09-17 (handover)

Docs pack rewritten so a new copilot does not inherit dual-door vs in-glass vs frozen-glass contradictions.
Next **build** session: discover, then Hands writes allow-list (item 2) — not more chrome.
