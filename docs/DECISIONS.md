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

## 2026-09-19 — D-0007 — Four agents, four lanes, and rules enforced as config

**Status:** active

Four agents now have hands on the bastion. Without lanes they duplicate work,
edit the same clone concurrently, and quietly run up cost on the metered one.

| Agent | Lane | Why it gets that lane |
| --- | --- | --- |
| **Cursor** (Remote-SSH as `agent`) | Architecture, decisions, cross-repo changes, review | Gordon is in the loop and all three repos are open at once |
| **Claude Code** | Bulk implementation inside one repo: multi-file builds, refactors, test loops | Subscription-billed, so a long run costs the same as a short one |
| **Grok CLI** | Short targeted edits, and headless scripted checks (`-p --output-format json`) | Metered per token — keep prompts short; best scripting surface of the four |
| **Goose** | On-node work over SSH, cluster discovery, cheap repetitive loops | The only one with passwordless SSH to all six nodes, and a free `llm-lan` profile |

Two constraints go with the lanes:

- **One agent at a time per repo.** They share one clone on one filesystem;
  concurrent sessions produce conflicting edits and interleaved commits.
- **`AGENTS.md` and `DECISIONS.md` change only in a session Gordon is watching.**
  Law must not drift as a side effect of an implementation loop.

### Hard rules are now enforced, not just written

AGENTS.md is prose, and prose is advisory: asked cold, an agent that had not
loaded it asserted GitHub was Flux's origin (D-0006). The hard rules are
therefore enforced in two layers that do not depend on the model cooperating.

**Config —** `.claude/settings.json`, committed at each repo root, plus a
user-scope copy at `~/.claude/settings.json` so the rules still apply when the
working directory is outside a repo. Claude Code reads it natively and Grok
reads it through Claude compatibility, so one file covers both. It denies the
mutating `kubectl` verbs, force-push, `git tag -f`, and reads of key material.
`jarvis-core` additionally denies all edits, which makes D-0003's "read-only
reference" mechanical rather than an honour system.

This file is **enforcement config, not a rules file** — D-0005 does not apply to
it, and it is not a second bible. Do not delete it as duplication.

**Shell —** `~/.agent-guard.sh`, sourced from `~/.bashrc`, replaces the
Goose-only guard. It intercepts `kubectl`, `k3s`, and `git` below whatever
permission system the agent uses, so it still holds when a model talks itself
past its own config or works in a repo whose rules it never loaded. It fires on
any of `GOOSE_TERMINAL`, `CLAUDECODE`, `GROK_AGENT`, `CURSOR_AGENT`, and is
inert in a human shell. The documented `install-*.sh` exception is
`AGENT_ALLOW_APPLY=1` (the old `GOOSE_ALLOW_APPLY` still works).

Neither layer is a security boundary — `sudo kubectl` and a direct binary path
both step around the shell guard. They are there to stop a confident agent, not
a determined attacker.

---

## 2026-09-19 — D-0006 — Claude Code and Grok CLI are sanctioned bastion agents

**Status:** active

Both are installed on the bastion as user `agent` and both read repo
`AGENTS.md`, so D-0005 holds across all three agents now in play (Cursor,
Goose, Claude Code, Grok CLI).

Two conditions make that true, and neither is obvious:

- **Claude Code** reads `AGENTS.md` only as a *fallback*, when a repo has no
  `CLAUDE.md`. None of the three repos has one. **Do not add a `CLAUDE.md`** —
  it silently wins over `AGENTS.md` and re-creates the second bible.
- **Grok CLI** loads project instructions only in a **trusted folder**. All
  three repos have been granted trust. In an untrusted clone it loads nothing
  and answers from pretraining *without saying so* — asked cold, it claimed
  GitHub was Flux's origin. Verify with `grok inspect`, which prints the files
  actually loaded. Never trust the model's own account of its context.

Grok's default model is pinned to `grok-4.6` in `~/.grok/config.toml`. The
shipped default was non-reasoning and got the Flux-origin question wrong even
with the contract loaded. Metered on `XAI_API_KEY`, the same key as Goose's
`xai` profile (D-0001).

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
