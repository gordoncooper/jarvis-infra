# JARVIS north star

Git tag and image tag are independent. Pins live in `VERSION`.
Live cluster is truth. Flux origin is Gitea (`http://git.lan/jarvis/cluster.git`).

This file is the **product spec**. It is not a backlog. Do not append
parked / someday / remaining lists here.

## Product

**chat.lan is the glass.** Tony does not pick models, open a second console,
or teach the house the same fact twice.

- Talk / RAG / voice: LiteLLM alias `jarvis`.
- **Do** (inspect / recycle): `jarvis-hands` → OpenClaw in-pod OpenAI shim `:4001`.
- Break-glass only: http://agent.lan:18789 and `./scripts/openclaw-ask.sh`.
- Goose: operator on the bastion only. Never nested in OpenClaw or chat.lan.
- gpu-02: embed-only (RAG). Not a second chat GPU.
- Picker stays as Tony's hatch.
- chat.lan does **not** show a resolved-model chip (OWUI rewrites the stream
  to `jarvis`). Do not build one.

## What "awesome" means

He talks. The house inspects itself when that is the question, stays quiet
when it is not, and does not invent a clock or a GPU number.

## Principles

1. Always-on tiny context, **or** a tool — never intent regex on English.
   Clock is the template. Keyword LIVE dumps are not.
2. One source per fact. Persona = `docs/persona.txt`. Rack = `docs/briefing.md`.
   Memory = `learned.md`. Live numbers = `/api/telemetry` or Hands.
3. Broad intelligence in the **router**, not famous phrases in git.
4. The 7B does not get tools (it fake-called them). Live questions leave the 7B.
5. Filters are **verbs Gordon said** (`remember that`), not topics (`gpu`).
6. OWUI sqlite is a cache. After recreate, one seed job. Flux env is not gospel.
7. Structural cleanup is allowed. Per-question special cases are not.
8. Do not replace Open WebUI, the 7B, or the glass. Use APIs we already have.
9. Prefer native LiteLLM / OpenClaw / k8s RBAC. One adapter per gap.
   Do not grow the filter pile.

## Routing

Today: `auto_router/complexity_router` + `keyword_tier_rules` +
`classifier_type: heuristic`.

Native LiteLLM target (no new product): `classifier_type: llm` with a JARVIS
rubric, then **delete** famous-phrase `keyword_tier_rules`. Do not add more
keyword rules while waiting.

| Tier | Model | Meaning |
| --- | --- | --- |
| SIMPLE / MEDIUM | `jarvis-local` | Talk, inventory, remembered facts |
| COMPLEX | `jarvis-hands` | Live cluster inspect / recycle |
| REASONING | `jarvis-grok-code` | YAML, Flux, patches, design |

- Classifier model: `jarvis-grok` (fast), `timeout_ms` ~2000,
  `classifier_fallback: heuristic`. Not the 7B. Not grok-code for "hi".
- `return_raw_model_name: true` stays. `session_affinity: false` stays.
- Do **not** make `semantic_keyword_matching` the primary brain.
- Prefixes `local:` / `hands:` / `code:` / `grok:` are OWUI override only.
  Do not put them in LiteLLM keywords.

A classifier change is **done** when these five land (not before):

- "hi" → local
- "what is a GPU?" → local
- "what's GPU VRAM on gpu-01?" → hands
- "are the nodes up?" → hands
- "write a Flux kustomization" → grok-code

## Memory

- `learned.md` is the writable notebook (apps-01 hostPath + NFS mirror).
- lab-docs / briefing = git rack facts. Seed is best-effort.
  Duplicate-content 400 is success.
- OpenClaw MEMORY.md / dreams stay private to OpenClaw.
- Do not commit `learned.md`.

## Live stats

- home.lan `/api/telemetry` is the HUD backend.
- Do **not** paste Prometheus into the 7B prompt.
- Chat live numbers go through Hands.

## Voice

- Piper GB male (`alloy`) in Flux.
- Laptop `jarvis-wake.py` is **transport**. No per-question injects on the laptop.

## Hands / RBAC

Role `openclaw-recycle` is **already live** (pod delete + deploy patch in
apps / inference / agents / monitoring). Do not re-implement it.

Do not widen that Role until Gordon **names the verbs**. Same shim.
No cluster-admin. No new panel. Cat live RBAC first.

## Copilot

- Live cluster > Gitea > `VERSION`. Git tag and image tag are independent.
  Never retag.
- Run as user **agent**, never `bastion`. Flux origin is Gitea, never GitHub.
- No homepage image bump unless `https://home.lan/status` is wrong.
- No tarball unless asked. Web chat: quoted heredoc. Bastion CLI/Cursor: use the shell.
- No new exact-phrase keyword PRs. No new persona copies. No new OpenClaw wrappers.
- If the 7B must not hallucinate a number, do not put that number in its prompt.
- One change per session. HUD CSS is chrome, not architecture.

House map: [README.md](../README.md).
AI contract: [COPILOT.md](COPILOT.md) and root [AGENTS.md](../AGENTS.md).

## Freeze (do not break)

- Pins: `VERSION` only. Never copy them into this file.
- OpenClaw timeout 180. Shim ASK_TIMEOUT 180. LiteLLM hands timeout >= 240.
- Canary **blue-banana-42** is briefing (lab-docs). **silver-orbit-3** is
  `learned.md`, not the secret phrase.
- New chat after SYSTEM / filter / router changes.
