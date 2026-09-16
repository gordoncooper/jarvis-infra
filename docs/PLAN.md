# PLAN.md — unified JARVIS (north star)


## Status (2026-09-15, live)

Done:
- LiteLLM alias `jarvis` (complexity_router). Default in chat.lan.
- Picker remains an escape hatch: jarvis, jarvis-local, jarvis-grok, jarvis-grok-code.
- ROUTED chip = resolved model. Native tools off. Arena/embed hidden.
- Piper alloy → en_GB-northern_english_male-medium.
- gpu-02 embed-only. No Qwen swap. No daily Grok cap.
- lab-docs + learned.md. Chat remember is append-only (`remember that …` → `/cluster/local/openclaw/learned.md`).
- LIVE telemetry only on rack-status phrasing.

Stop polishing: 7B will still narrate deletes; near-duplicate learned lines. seed-learned is idempotent.

Left (in order):
1. Hands LOCKED (dual door): chat.lan = talk/RAG/voice; OpenClaw = actuator (http://agent.lan:18789 or `./scripts/openclaw-ask.sh`). No inbox/drain, no chat.lan auto-invoke, no nested Goose. WS chat.send from OWUI is later/optional, not the plan.
2. Tag v0.4.26 when this chunk lands (image stays v0.4.9).
3. seed-learned.sh DONE — wait for embed; duplicate content = success (idempotent).
Later: wake-word, Tailscale, spend cap, Qwen3.

Living goal. Not live inventory. Live cluster still wins.
Decisions below are locked 2026-09-15 after operator answers.
Do not start a new product (Mem0, Graphiti, extra chat UI, wake-word).

## Tony never picks (default)

One mouth: **https://chat.lan**. Default model alias **`jarvis`** (LiteLLM).
The picker **stays** as an escape hatch — Tony can still select
`jarvis-local` / `jarvis-grok` / `jarvis-grok-code` by hand, same as today.
That must not be the default path.

Voice of the 7B = [`persona.txt`](persona.txt). Rack facts = [`briefing.md`](briefing.md).
Hands on the cluster = OpenClaw (`http://agent.lan:18789`) on **grok-code**.
Goose on the bastion is **the operator console**, not a nested slave of OpenClaw.

## Locked answers (2026-09-15)

| Question | Decision |
| --- | --- |
| Picker | Keep it. Default is auto `jarvis`. Manual pick is Tony's override. |
| Chip | **Indicator only**, not a selector. Show which model the router chose. |
| 7B writes | **`remember` only** (learned.md). No kubectl/ssh/Flux/secrets. If writes get ambiguous, strip them. |
| Hands | OpenClaw is the automatic actuator. Goose stays human-on-bastion. **Do not nest Goose under OpenClaw.** |
| Spend cap | Start with **request/day + RPM** on xAI aliases (see Spend). Tune after a week of logs. |
| gpu-02 | **nomic-embed stays**. Spare VRAM is reserve, not a second JARVIS personality. |
| Voice model | Keep Qwen2.5 7B Q6 on gpu-01 for now. **Robotic sound is Piper TTS first**, not a model swap. Qwen3:8b is a later A/B if tools fail or prose stays stiff after TTS. |

## Architecture (target)

    Tony  ->  chat.lan (one default: jarvis)
                |
                v
           LiteLLM alias `jarvis`
           complexity_router + keyword rules
                |
        SIMPLE  +-- jarvis-local (gpu-01, free, RAG, remember)
        OPS     +-- jarvis-grok-code (OpenClaw / tools)
        HARD    +-- jarvis-grok (reasoning, no cluster writes)

Keyword examples (intent, not 503): kubectl, flux, ssh, git commit, deploy, yaml
  -> grok-code. "hi", RAG, lab facts -> local.

**Do not** escalate on HTTP errors (local timeout must not become a Grok bill).
**Do not** use an LLM classifier on every turn (double GPU or double Grok).
Session affinity: pin the first-turn model for the thread.

If the pinned LiteLLM digest lacks `auto_router/complexity_router`, v1 is
keyword rules only (still one alias). Verify the image before bumping digest.

Chip: LiteLLM should return the **resolved** model. If chat.lan only shows
the alias `jarvis`, add a tiny Open WebUI filter that prints the routed id.
Discovery first — do not invent a new HUD for this.

## 1. Router (chat.lan + LiteLLM)

Stay on Open WebUI. Do not add a fourth chat surface.

- Default model = `jarvis` (hide nothing; just stop defaulting to a raw id).
- LiteLLM owns routing. No Open WebUI community "Auto Router" pipe.
- Fallbacks stay **in-tier**. Escalation is keyword/complexity, not failover.
- Pinned image: bump LiteLLM digest only if auto-router is missing.

## 2. Memory / RAG

Already enough for this lab: git briefing + learned.md + nomic on gpu-02.
Do **not** add Mem0 / Graphiti / Letta / extra vector DB.

Optional later, cheap only: hybrid BM25+vector, Top-K 3-5, chunk ~1000.
Skip ENABLE_KB_EXEC until the 7B actually tool-calls.

Write path stays `scripts/remember.sh` (OpenClaw workspace + NFS mirror +
hourly seed into `jarvis-learned`).

## 3. Hands vs voice (responsibility)

The 7B is the **voice**. It will not grow kubectl. Open WebUI: native tools
on models under ~30B are unreliable. gpu-01 is ~6/8 GiB — no second local brain
on the same card.

| Actor | May | Must not |
| --- | --- | --- |
| jarvis-local (7B) | Talk, RAG, remember, read `https://home.lan/api/telemetry` | kubectl, ssh, apply Flux, read secret files |
| jarvis-grok-code + OpenClaw | Inspect and change the cluster, git, files | Nest Goose; invent hardware |
| Goose (bastion) | Operator terminal on jarvis-infra | Default Tony path; spawned by OpenClaw |

OpenClaw already SSHs and kubectl. Nesting `goose` inside OpenClaw is a
spend loop and two writers on the same git. If a gap appears (multi-file
edit on the bastion repo), add a **narrow OpenClaw skill** that ssh's to
bastion and runs git/tests — not `goose session`.

7B tools (cap 3-5, when we get there): `cluster_status`, `search_lab_docs`,
`remember`. Nothing else.

## gpu-02 (decision)

Keep **nomic-embed-text** as the job of gpu-02. Idle VRAM is intentional
headroom so RAG does not fight a second 7B.

Later, only if phase 1 is done and we still need it, **one** of:
- CPU/GPU rerank (RAG quality), or
- a single tool-specialist (e.g. Qwen3 8B Q4) **instead of** a second chat face.

Never two JARVIS voices.

## Voice (natural, not robotic)

Treat in this order:

1. Piper / openedai-speech **voice id** (chat.lan admin audio). This is the robot.
2. `persona.txt` / model system prompt (less stiff prose).
3. Qwen3:8b swap on gpu-01 — only if (1)+(2) fail or tool-calling is required.

Do not burn a week on a new TTS stack (XTTS, etc.).

## Spend (Grok ceiling)

LiteLLM can cap **per model_name**. Useful metrics:

| Metric | Example | What it stops |
| --- | --- | --- |
| rpm | 10 req/min on `jarvis-grok*` | runaway loops |
| daily request count | **100 completions/day** on xAI aliases (starting cap) | overnight burn |
| max_budget | dollar cap if the key is PAYG | bill shock (SuperGrok may be quota, not $) |
| no 503-up-fallback | local fail stays local | silent Grok spend |

Start: **100 grok completions/day**, **rpm 10**, no error-escalation to Grok.
After a week of LiteLLM logs, raise or lower. A "chip" that says grok-code
is the human circuit-breaker.

## Sequence (do not skip)

0. Snapshot: NFS stamp `20260915-1923` is the rollback point until the next on-demand.
1. Discover live LiteLLM `config.yaml` + whether this digest has complexity_router.
2. Add alias `jarvis` + keyword rules + session affinity. chat.lan default = `jarvis`.
3. Chip / resolved-model indicator (discovery: does OWUI already show it?).
4. One read-only telemetry tool on the 7B. remember stays the only write.
5. RAG hybrid only if (4) is boring.
6. Piper voice pass (natural speech) — independent of the router.
7. Qwen3:8b A/B only if tools/prose still fail.

Out of scope until the operator says so: wake-word, Tailscale, house/HA,
new frontend, Mem0, giving the 7B kubectl.

## Rabbit holes (refuse)

New chat UI. Community OWUI auto-router pipe. LLM-classifier every message.
14B/30B on an A1000. Graph memory products. OpenClaw spawning Goose.
