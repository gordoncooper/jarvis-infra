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
