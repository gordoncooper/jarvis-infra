# Decisions

Append-only. Newest first. **A decision here outranks any prose in any other
doc.** If a doc contradicts a decision below, the doc is stale — fix the doc.

Each entry: what was decided, when, why, and what it supersedes. Never edit a
past entry to change its meaning; add a new one that supersedes it and mark the
old one `SUPERSEDED BY`.

Why this file exists: JARVIS has been guided by several different AI assistants,
each of which wrote confident prose describing a different product. Nothing
recorded which vision was current, so every new session picked a different one
and the build pulled apart. Decisions are now dated and ranked above prose.

Skim this index and open only the entries your task touches. Keep new entries
short — this file is authority #2, so every agent pays to read it.

| # | Decision |
| --- | --- |
| D-0023 | Hands slice 2: confirm verbs recycle_pod + restart_deploy |
| D-0022 | Hands slice 1: three trusted verbs via OpenClaw constrained `/v1/verbs` |
| D-0021 | Product k8s/image names; implementation cuts start at v0.6.0 |
| D-0020 | Product code in `jarvis-app`; Python orchestrator + themed TS glass; `/v1` + SSE |
| D-0019 | v1 model roles: local talker+classifier; cloud specialist `jarvis-grok`; orchestrator picks |
| D-0018 | Product stays LAN-only for v1; no auth project until off-LAN is deliberately chosen |
| D-0017 | v1 glass scope: greeting+briefing blurb+thread; replace stub; PTT in bar; confirm UI deferred |
| D-0016 | Product STT is orchestrator-proxied (Option Y); supersedes D-0015 call path |
| D-0015 | Whisper on gpu-02 (`small`); OpenAI transcriptions — call path superseded by D-0016 |
| D-0014 | v1 voice: glass PTT first; cluster Whisper; Piper TTS; laptop wake on same API |
| D-0013 | v1 memory: five stores; sqlite promoted on NFS; explicit remember auto-saves |
| D-0012 | Product path is glass shell + separate orchestrator; anti-smear wiring |
| D-0011 | v1 glass is LAN-default; one named cloud role allowed, with honest offline fallback |
| D-0010 | OpenClaw is break-glass + optional constrained actuator; not the product orchestrator |
| D-0009 | Third attempt builds glass before hands; NL/voice flexible, verb execution rigid |
| D-0008 | Claude/Grok deny list is irreversible-only; `kubectl apply` is shell-guarded with a `--dry-run` exception |
| D-0007 | Hard rules are enforced as deny rules and a shell guard, not prose alone |
| D-0006 | Claude Code and Grok CLI are sanctioned bastion agents; both read `AGENTS.md` |
| D-0005 | One rules file per repo: `AGENTS.md`, tracked in git |
| D-0004 | Governance docs split by lifetime: law / decisions / spec / state / history |
| D-0003 | `jarvis-core` is prior art, not the go-forward build |
| D-0002 | `jarvis.lan` is the product surface; `chat.lan` is break-glass |
| D-0001 | Goose runs on switchable backend profiles |

---

## 2026-09-20 — D-0023 — Hands slice 2: confirm-class recycle verbs

**Status:** active. Extends D-0022 with Gordon-named **confirm** verbs.

| Verb | Class | Args | Backend |
| --- | --- | --- | --- |
| `apps.recycle_pod` | confirm | `namespace`, `name` | `k8s.js delete-pod` |
| `apps.restart_deploy` | confirm | `namespace`, `name` | `k8s.js restart-deploy` |

Namespaces allowlisted only: `apps`, `inference`, `agents`, `monitoring`
(existing `openclaw-recycle` Roles — **no RBAC widen**).

**Path:** match → session pending (90s) → glass Confirm/Cancel or wake/typed
`yes`/`cancel` → shim `POST /v1/verbs` with `confirmed:true` → audit.
Shim refuses write verbs without `confirmed`.

Trusted read verbs from D-0022 unchanged.

---

## 2026-09-20 — D-0022 — Hands slice 1: three trusted verbs

**Status:** active. Names the first product verbs under D-0009 / D-0010.
Confirm/recycle verbs: see D-0023.

Gordon confirmed the catalog. **Trusted** (auto-run, no confirm UI):

| Verb | Backend |
| --- | --- |
| `cluster.health` | OpenClaw skill helpers `k8s.js nodes` + `pods` |
| `cluster.gpus` | Prometheus helpers for GPU temp + memory |
| `lab.map` | Static product URL map + live node list |

**Path:** glass/wake → orchestrator heuristic match → OpenClaw shim
`POST /v1/verbs` with `{verb}` (not free-form agent chat) → audit row → reply.
No RBAC widen. Confirm-class recycle verbs: D-0023.

**Classifier:** ingress regex on the orchestrator for v1; may add LLM classify
later without changing the verb boundary.

---

## 2026-09-19 — D-0021 — Product names; build cuts start at v0.6.0

**Status:** active.

**Tagging:** `v0.5.2` is the planning-freeze snapshot across `jarvis-infra`,
`cluster`, `jarvis-app`, and `jarvis-core`. **Implementation / slice work
starts at `v0.6.0`** — create that tag when slice 1 lands, not before. Never
retag (law).

**Kubernetes (product path, namespace `apps`):**

| Kind | Name |
| --- | --- |
| Deployment + Service | `jarvis-glass` |
| Deployment + Service | `jarvis-orchestrator` |
| Ingress Host | `jarvis.lan` → **glass only** |
| Orchestrator exposure | ClusterIP (and/or mesh-internal); not a public Host |

Glass talks to orchestrator in-cluster (D-0012). Do not put LiteLLM/OWUI/OpenClaw
on the Ingress for the product path.

**Images** (built from `jarvis-app`, independent of homepage `IMAGE` in infra
`VERSION`):

| Image | Role |
| --- | --- |
| `docker.io/library/jarvis-glass` | Static themed UI |
| `docker.io/library/jarvis-orchestrator` | Brain / `/v1` API |

Product image tags live in a `VERSION` (or equivalent) **in `jarvis-app`**,
sourced by build scripts — do not retype pins into prose. Infra `VERSION`
keeps rack/`jarvis-home` pins.

**Later (not slice 1):** `jarvis-whisper` on gpu-02 (D-0015/D-0016). Themes are
assets/packs under `jarvis-app`, not separate Deployments.

**Cutover:** new glass+orchestrator replace the `jarvis-core` stub on
`jarvis.lan` (D-0017). Leave `noc.lan` alone.

---

## 2026-09-19 — D-0020 — jarvis-app product repo; orchestrator + themed glass; `/v1` API

**Status:** active. Pins implementation home and v1 API shape under D-0012 / D-0017.

**Repos / layers**

| Layer | Repo | Origin |
| --- | --- | --- |
| Metal, law, scripts, SOPS, discover | `jarvis-infra` | GitHub |
| Flux YAML only | `cluster` | Gitea |
| Prior art (read-only) | `jarvis-core` | GitHub |
| **Product: orchestrator, glass, themes** | **`jarvis-app`** (new) | GitHub |

Factory apps JARVIS builds later get **their own repos** (or a products org). Their
Flux manifests still land in `cluster`. Do not put factory output into
`jarvis-infra` metal or into `jarvis-app` unless deliberately promoted to product.

**Runtime:** two Deployments — **glass** and **orchestrator** (D-0012). Flux
YAML in `cluster`; images built from `jarvis-app`.

**Languages:** Python orchestrator (FastAPI/Starlette or equivalent). Glass is
TypeScript compiled to **static** assets (not a Vite/App Builder greenfield).
Orchestrator is **theme-agnostic**. Look-and-feel is a **theme pack** in
`jarvis-app`; swap theme via commit → image/ConfigMap → Flux restart. A theme
library is allowed; rich dynamic visuals may grow inside themes later without
moving policy into the glass.

**API (v1):** versioned under `/v1/`. Minimum: `GET /health`, `GET /v1/session`,
`POST /v1/turns` (text or multipart audio per D-0016), TTS fetch as needed.
**SSE** for reply streaming is in scope for v1. Further endpoints may be added
under `/v1/` or a later `/v2/` without breaking clients. Glass sends no model
ids (D-0019).

**Out:** product source in `cluster`; evolving `jarvis-core` as the app home;
smearing LiteLLM/OWUI as the product API.

---

## 2026-09-19 — D-0019 — v1 model role pins

**Status:** active. Pins VISION open question 3 / D-0011 for the product path.

The **orchestrator** selects the model id per turn. The glass never shows a
model picker and never passes LiteLLM aliases. Product traffic does **not** use
the `jarvis` complexity auto-router or `keyword_tier_rules` as the daily driver.

| Role | LiteLLM id | When |
| --- | --- | --- |
| Talker | `jarvis-local` (Ollama 7B) | Default conversation |
| Classifier | `jarvis-local` | Short classify prompts (remember vs chat, etc.) |
| Cloud specialist | `jarvis-grok` (`grok-4-fast`) | The one named cloud hop (D-0011) |
| Embed | `jarvis-embed` | Optional memory projection only |
| Coder | deferred | Not required for v1 glass; see note below |
| Hands | not product | `jarvis-hands` / OpenClaw remain break-glass (D-0010) |

**Offline:** if `jarvis-grok` is unreachable, stay on `jarvis-local` and say so.
If local inference is down, degraded banner (D-0017) — no silent cloud-only
talker.

**Coder (deferred) means a product role**, not the bastion workshop. When hands
land, “coder” is an orchestrator-selectable model (likely `jarvis-grok-code`)
for house tasks spoken through `jarvis.lan` (e.g. draft a Flux diff the verb
path may apply). It is **not** Claude Code / Grok CLI / Cursor / Goose — those
stay **operator workshop** agents on the bastion (and guidance in D-0007).
Building JARVIS and being JARVIS stay separate.

---

## 2026-09-19 — D-0018 — Product is LAN-only for v1; auth waits for off-LAN

**Status:** active. Answers VISION open question 6 for v1.

`jarvis.lan`, the orchestrator, Whisper, and Piper stay **on the LAN**. No
product off-LAN exposure in v1. No auth/OIDC/SSO project for the glass while
that is true — LAN trust.

**Before** any product surface is reachable outside the LAN, stop and record a
new decision for auth and exposure. Silent tunnel / DNS / Traefik tweaks that
publish the product do not count as “later.”

**Deferred options (known, not chosen):** Gordon has a Dynu domain and a
personal Tailscale account. Either may be considered when off-LAN is
deliberately on the table; neither is a v1 dependency or a default. Prefer the
option that earns its ops cost when that session comes.

Break-glass (`chat.lan`, `agent.lan`, etc.) unchanged and still not the product
path (D-0002).

---

## 2026-09-19 — D-0017 — v1 glass scope

**Status:** active. Sequences product UI under D-0009 / D-0012.

**Surface:** `jarvis.lan` is a **new** glass shell + **new** orchestrator. They
**replace** the live `jarvis-core` stub on that Host. Do not evolve the stub in
place (D-0003). `noc.lan` and break-glass hosts stay independent.

**First viewport:** greeting + short briefing blurb + conversation thread (and
input / PTT). Not a NOC, not a widget wall, no model picker.

**v1 done bar** (Gordon on `jarvis.lan` only):

1. Feels like JARVIS (not OWUI, not NOC)
2. Typed conversation with persona; no model picker
3. Session survives glass restart (D-0013)
4. Explicit remember / forget per D-0013 auto path
5. PTT once → orchestrator → Whisper (D-0016) → text reply; Piper when TTS up
6. Honest degraded state if orchestrator or LLM is down

**Memory UI in this slice:** explicit “remember that…” / “forget…” only
(auto-save / tombstone). **Confirm cards deferred** — non-explicit candidate
facts are **not** written in v1 glass (refuse or ignore until confirm UI
ships). This narrows D-0013’s “confirm non-explicit remembers in glass” for
the v1 glass milestone only; the doctrine otherwise stands.

**v1 extras kept:** degraded banner that does not depend on the talker; clean
cutover of `jarvis.lan` ingress to the new glass.

**Out of v1 glass:** hands/verbs, laptop wake as a gate, confirm cards, second
voice, off-LAN auth, mini-NOC chrome, extending `jarvis-core`.

---

## 2026-09-19 — D-0016 — Product STT is orchestrator-proxied (Option Y)

**Status:** active. SUPERSEDES D-0015’s call-path choice (Option X).

Glass and laptop send **audio to the orchestrator**; the orchestrator calls
Whisper on gpu-02 and continues the turn with text. Clients do not hold a
product Whisper URL or STT credential. Whisper remains internal LAN infra
(Service + NetworkPolicy), OpenAI-compatible, digest-pinned, model `small`,
request/response — all as in D-0015.

**Why switch:** stronger anti-smear / one front door (D-0012), one product
credential story, Whisper stays a dumb engine. On this LAN the extra hop is
not the dominant voice latency (Whisper + talker + TTS are); Option X’s
responsiveness edge was theoretical for lab scale.

Laptop wake and glass PTT both use this path once they speak to the
orchestrator API (D-0014).

---

## 2026-09-19 — D-0015 — Whisper service shape (v1)

**Status:** SUPERSEDED BY D-0016 for call path. Placement, model, and API pins
below still stand.

**Placement:** dedicated Whisper Deployment on **gpu-02** (CUDA). Do not put STT on
gpu-01 (chat VRAM) or bury it inside OWUI / the orchestrator pod. Embedding on
gpu-02 stays; STT is not a second chat model (VISION non-goal still holds).

**Model:** pin **`small`** for v1 (better punctuation/accuracy than today’s OWUI
`base`, still modest next to nomic-embed). Shrink only if measured pressure on
embed/VRAM demands it.

**API:** OpenAI-compatible `POST /v1/audio/transcriptions`, **request/response
only** (no streaming partials in v1). Image **digest-pinned** (no `:latest`).

**Product call path:** SUPERSEDED BY D-0016 (Option Y — orchestrator proxies
audio). Was Option X (clients → Whisper → text → orchestrator).

**Not required for v1:** an explicit concurrency-cap rule (lab scale; GPU-bound
STT). Add later if abuse or queueing shows up.

**Latency note:** on this LAN the dominant voice delay is Whisper inference +
talker (+ TTS), not an extra in-cluster hop.

---

## 2026-09-19 — D-0014 — v1 voice stack

**Status:** active. Answers VISION open question 5 for v1.

Voice is **ingress and egress**, not a second brain. Typed and spoken turns both
become text to the orchestrator (D-0012). Messy STT is expected; verb/memory
boundaries stay as in D-0009 / D-0013.

**Primary daily path (v1):** push-to-talk / Call-like mic on `jarvis.lan` first.
**Laptop wake** (`hey jarvis` via openWakeWord / `jarvis-wake.py`) ships as soon
as it can call the **same orchestrator API** — not a parallel OWUI path. Stock
wake phrase only; no custom wake model and no always-on cluster room mic in v1.

**STT:** cluster Whisper is the product source of truth. Glass and laptop are
clients. Browser Web Speech may fallback; OWUI’s embedded Whisper is break-glass
only, not product SoT.

**TTS:** Piper on-cluster remains the product speaker; keep the GB mapping
(`alloy` → en_GB-northern_english_male-medium) as the default JARVIS voice. A
**second** voice may be added later; do not make Kokoro / browser Web API the
product voice.

**API discipline:** orchestrator returns reply text and may attach or authorize
a TTS audio reference so clients do not each re-wire Piper. Shared cluster STT
serves both glass upload and laptop transport.

**Transport rules (keep):** laptop/glass listeners do not special-case questions
or inject live telemetry. Local UX commands (stop / pause / mute / repeat /
status) stay on the client after STT and are not chat turns or verbs.

**Degraded:** if Piper or Whisper is down, glass still shows text and says so.
`chat.lan` voice remains break-glass when the product path is sick.

**v1 extras kept:** shared cluster STT; orchestrator-owned TTS contract; glass
PTT before chasing perfect wake.

**Out for v1:** always-on room mics, cloud STT/TTS as primary, duplex phone-call
barge-in as a requirement, custom wake training.

---

## 2026-09-19 — D-0013 — v1 memory doctrine

**Status:** active. Answers VISION open question 4 for v1.

Five kinds of “memory,” one source each. Live cluster truth is **not** a memory
store — it is queried, never persisted as fact.

| Store | SoT | Writer |
| --- | --- | --- |
| Persona | git (`docs/persona.txt`) | Human in git |
| Briefing (stable world) | git (`docs/briefing.md`) | Human in git |
| Promoted | sqlite on NFS under `/cluster/nfs/jarvis/` | Orchestrator only |
| Session | orchestrator-local (survives **glass** restart) | Orchestrator |
| Live | kubectl / metrics / tools | Nobody as “memory” |

**Promoted:** sqlite rows (id, timestamp, text, source turn, tombstone). Forget is
first-class (soft-delete + audit line). Embeddings, if used, are a rebuildable
**projection** of sqlite — not a second source of truth.

**Remember / forget ingress:** clearly marked phrases (“remember that…”,
“forget…”, and close variants after STT cleanup) may **auto-save** /
tombstone. Any other candidate fact is shown in the glass and requires
**confirm** before write. Normalized one-line facts; model inference alone is
never stored.

**Git boundary:** product “remember” **never** writes git. Promote-to-briefing
is a later explicit path, not v1. Keep today’s git briefing vs NFS promoted
split.

**Session durability (v1):** survive glass restart. Surviving orchestrator
restart (e.g. session sqlite on NFS) is an allowed later enhancement, not
required for v1.

**Never written:** secrets, tokens, key material, raw vault contents, live
metric snapshots-as-facts, unconfirmed model inferences, OpenClaw private
dreams as product memory.

**Product path:** glass reads/writes memory only via the orchestrator (D-0012).
OWUI filters + hostPath `learned.md` remain break-glass / legacy until migrated;
they are not the product SoT.

**v1 extras kept on purpose:** confirm UI for non-explicit remembers; forget +
audit; session that outlives the glass process.

---

## 2026-09-19 — D-0012 — Glass shell + separate orchestrator; no smeared product path

**Status:** active. Answers VISION open question 2 for deployment shape.

The product path is **split**: a glass shell on `jarvis.lan`, and a **separate
orchestrator** service. The orchestrator owns routing, session state,
confirmations, the audit log, and (when hands land) verb dispatch.

**Anti-smear:** the glass (and later voice client) talks **only** to the
orchestrator. No direct product wiring from the glass to LiteLLM, Open WebUI,
or OpenClaw. Those remain backends the orchestrator may call, or break-glass
surfaces outside the product path.

`noc.lan` stays independent of the brain (D-0002). `chat.lan` and `agent.lan`
remain break-glass and are not the product conversation path.

Supersedes: any design that routes `jarvis.lan` through OWUI filters, LiteLLM
aliases, or OpenClaw as the daily driver (the shape VISION called out as
smeared).

---

## 2026-09-19 — D-0011 — v1 glass is LAN-default; one named cloud role may hop

**Status:** active. Answers VISION open question 3 for v1.

Classifier and talker for `jarvis.lan` default to on-LAN models (Ollama via
LiteLLM). One **named** cloud role is allowed from day one (e.g. hard reasoning
or a later coder path), summoned deliberately — not the married primary brain.
When that role or the internet is unavailable, the glass degrades honestly and
keeps serving on LAN. Cloud-only as the primary talker is refused for v1.

Does not settle which exact model fills the cloud role; that is a later pin.
Operator/break-glass paths (`chat.lan` prefixes, Goose `xai`) stay as they are.

---

## 2026-09-19 — D-0010 — OpenClaw is not the product orchestrator

**Status:** active. Answers VISION open question 1 for the actuator side.

OpenClaw stays on `agent.lan` as **break-glass** and may later execute
**declared** product verbs as a constrained backend (verb name + args, not
free-form agent chat). It does **not** own the product glass, routing,
confirmations, session state, audit log, or verb registry — those live in the
third-attempt orchestrator.

Do not replace OpenClaw in this planning pass. Do not widen its RBAC unless
Gordon names the verbs. Revisit replacement only if it keeps fighting verb
discipline after the glass is real.

---

## 2026-09-19 — D-0009 — Glass before hands; flexible ingress, rigid verbs

**Status:** active. Sequences the third attempt (D-0003).

Build and establish `jarvis.lan` as the calm product surface **before** investing
in the hands path. When hands land, ship a real verb catalog (`trusted` /
`confirm` / `refuse`), not a toy read-only stub — flexible enough for daily use,
including voice (messy STT, missing punctuation).

Split that matters: natural language and voice are flexible at **ingress**;
execution is rigid at the **boundary** (named verb + args + class + audit). The
model maps messy speech onto declared verbs; it never invents verbs.

Supersedes: any implication that a thin read-only hands spike precedes glass.

---

## 2026-09-19 — D-0008 — Prefix deny rules cannot express “except dry-run”

**Status:** active. Narrows D-0007.

`.claude/settings.json` prefix rules match `kubectl apply --dry-run` the same as
a real apply, so they blocked a read-only check. `kubectl replace` is
Flux-recoverable, same as patch.

Claude/Grok deny is now only irreversible ops (PVC/PV/namespace delete,
force-push, `git tag -f`, key material). `kubectl apply` lives only in
`~/.agent-guard.sh`, which lets `--dry-run` through.

---

## 2026-09-19 — D-0007 — Hard rules are enforced, and aimed at what cannot be undone

**Status:** active

Prose is advisory: asked cold, an agent that had not loaded `AGENTS.md` asserted
GitHub was Flux's origin (D-0006). The hard rules are therefore enforced in two
layers that do not need the model to cooperate.

- **`.claude/settings.json`** — committed at each repo root, plus a user-scope
  copy so the rules hold outside a repo too. Claude Code reads it natively and
  Grok through Claude compatibility, so one file covers both. This is
  *enforcement config, not a rules file*: D-0005 does not apply, and it is not a
  second bible. Do not delete it as duplication.
- **`~/.agent-guard.sh`** — sourced from `~/.bashrc`, replaces the Goose-only
  guard. Wraps `kubectl`, `k3s` and `git` beneath whatever permission system the
  agent uses. Fires on `GOOSE_TERMINAL`, `CLAUDECODE`, `GROK_AGENT` or
  `CURSOR_AGENT`; inert in a human shell.

**What is guarded is what cannot be undone.** `patch`, `edit`, `scale` and
ordinary deletes are deliberately left alone — Flux reconciles them within a
minute, and blocking routine debugging is how a guard earns itself a
`--dangerously-skip-permissions` habit, after which nothing is protected.
Blocked instead: `kubectl apply`/`replace` (named in law, and how drift starts),
deleting a PVC, PV or namespace, `git push --force`, `git tag -f`, and reads of
key material. `--force-with-lease` is deliberately left available: it is the
safe variant, and blocking it was a false positive worth fixing rather than
tolerating. `learned.md` is gitignored in all three repos rather than merely
forbidden in prose.

Two hatches, kept separate so running an install script does not also unlock
data deletion: `AGENT_ALLOW_APPLY=1` for the documented `install-*.sh`
exception, and `AGENT_ALLOW_DESTROY=1` for PVC/PV/namespace deletion.

Neither layer is a security boundary — `sudo kubectl` and a direct binary path
both step around the shell guard. They stop a confident agent, not an attacker.

### Which agent to use — guidance, not law

Ignore this per task when it does not fit; it is a cost and capability note, not
a ruling. Cursor for architecture, decisions and cross-repo work, with Gordon in
the loop. Claude Code for bulk implementation, since it is subscription-billed
and a long run costs the same as a short one. Grok CLI for short edits and
headless scripted checks, since it is metered per token. Goose for on-node work
over SSH and cheap loops, being the only one with passwordless SSH to all six
nodes and a free `llm-lan` profile.

`AGENTS.md` and `DECISIONS.md` still change only in a session Gordon is
watching. Law should not drift as a side effect of an implementation loop.

---

## 2026-09-19 — D-0006 — Claude Code and Grok CLI are sanctioned bastion agents

**Status:** active

Both run on the bastion as `agent` and both read repo `AGENTS.md`, so D-0005
holds across all four agents. Two non-obvious conditions make that true:

- **Claude Code** reads `AGENTS.md` only when a repo has no `CLAUDE.md`. None
  has one. **Never add a `CLAUDE.md`** — it silently outranks `AGENTS.md`.
- **Grok CLI** loads instructions only in a *trusted* folder; all three are
  granted. Untrusted, it loads nothing and answers from pretraining without
  saying so — it claimed GitHub was Flux's origin. Check `grok inspect`, never
  the model's own account of its context.

Grok is pinned to `grok-4.6` in `~/.grok/config.toml`; the shipped default was
non-reasoning and failed the same question. Metered on `XAI_API_KEY`, the key
Goose's `xai` profile also uses (D-0001).

---

## 2026-09-19 — D-0005 — One rules file per repo: `AGENTS.md`, tracked in git

**Status:** active

Three repos had three conventions: `jarvis-infra` carried both `AGENTS.md` and
`.cursor/rules/jarvis.mdc` (which restated it), `cluster` had only `AGENTS.md`,
and `jarvis-core` had only an untracked `.cursor/rules/rules.mdc`.

Decided: **`AGENTS.md` at the repo root is the only rules file, and it is always
tracked in git.** The `.mdc` files are deleted.

Two reasons, the second being the practical one:

- A `.mdc` that restates `AGENTS.md` is a second bible in miniature, and both
  were being injected into the same session — the exact duplication D-0004 exists
  to stop.
- `.mdc` is Cursor-only. **Goose reads `AGENTS.md`** (it ships in
  `CONTEXT_FILE_NAMES` by default) and cannot see `.mdc` at all. With Goose
  holding a shell and passwordless SSH to every node, repo rules it cannot read
  are worse than useless. One file that every agent reads beats one file per tool.

Untracked rules are also per-clone rules: an agent on another machine silently
gets no guidance. If it governs behaviour, it is versioned.

---

## 2026-09-19 — D-0004 — Governance docs restructured around law / spec / state / history

**Status:** active

The doc set had grown to roughly 2,500 lines that mixed permanent constraints
("never retag", "Gitea is Flux origin") with expiring status ("frozen glass is
lifted", "this slice", version pins, dated handover notes). An agent could not
tell which lines were binding.

Docs are now separated by lifetime:

| Kind | Lives in | Changes |
| --- | --- | --- |
| Law — constraints that outlive any design | `AGENTS.md` | rarely, by decision |
| Decisions — dated, ranked above prose | `docs/DECISIONS.md` | append-only |
| Spec — what we intend to build | `docs/VISION.md` | per re-architecture |
| State — what is true right now | the live cluster, via discover scripts | constantly |
| History — footguns already paid for | `docs/LESSONS.md` | append-only |
| Tickets | `docs/BACKLOG.md` | constantly |

No doc asserts live state. State comes from `kubectl` and the discover scripts.

Supersedes: the practice of `PLAN.md` and `COPILOT.md` each acting as a
self-declared source of truth.

---

## 2026-09-19 — D-0003 — jarvis-core is prior art, not the go-forward build

**Status:** active

`jarvis-core` was the second attempt at the JARVIS brain (`policy.yaml`, the
HUD/LAYOUT specs, the noc slice). Its *thinking* is worth keeping — the verb
model with trusted/confirm/refuse classes, and the split between a calm product
surface and a dense NOC. Its *implementation* is not the foundation we build on.

Gordon's call: plan a clean third attempt rather than force the existing code
forward. `jarvis-core` is therefore read-only reference material. Do not extend
it, and do not treat `jarvis-core/policy.yaml` or `docs/HUD.md` as binding
contracts on the next build — they are inputs to the design, at the same rank
as any other proposal.

What survives untouched: the metal, k3s, Flux, Gitea, and the inference stack.
The rebuild is the brain and the glass, not the rack.

Supersedes: D-0002's implication that jarvis-core was the vehicle for the new
product surface.

---

## 2026-09-19 — D-0002 — jarvis.lan is the product surface; chat.lan is break-glass

**Status:** active

Two docs asserted opposite products. `docs/PLAN.md` said "chat.lan is the
glass"; `jarvis-core/docs/HUD.md` said jarvis.lan is the product and chat.lan
is break-glass. Both were read as authoritative by different sessions.

Decided: **jarvis.lan is the product surface.** Open WebUI at chat.lan is
break-glass, kept ugly and unthemed. `home.lan` retires into `noc.lan`, which
is the operator/NOC surface and must render even when the brain is down.

This matches what is already live: `jarvis.lan` and `noc.lan` both serve today.

Supersedes: "chat.lan is the glass" everywhere it appears.

---

## 2026-09-19 — D-0001 — Goose runs on switchable backend profiles

**Status:** active

Goose on the bastion was hardwired to LiteLLM at `llm.lan` by a single config
plus a `GOOSE_MODEL` export in `~/.bashrc`, and re-running the installer
clobbered whatever was active.

Decided: two profiles, `llm-lan` (free, on-LAN) and `xai` (metered, direct to
api.x.ai on `grok-build-0.1`), switched with `goose-backend`. Both pin their
model in-profile; no `GOOSE_MODEL` env export, because an env var outranks the
profile and silently defeats the switch.

Goose must never run on `jarvis-local` — the 7B invents shell output.
