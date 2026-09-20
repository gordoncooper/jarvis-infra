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
| D-0008 | Claude/Grok deny list is irreversible-only; `kubectl apply` is shell-guarded with a `--dry-run` exception |
| D-0007 | Hard rules are enforced as deny rules and a shell guard, not prose alone |
| D-0006 | Claude Code and Grok CLI are sanctioned bastion agents; both read `AGENTS.md` |
| D-0005 | One rules file per repo: `AGENTS.md`, tracked in git |
| D-0004 | Governance docs split by lifetime: law / decisions / spec / state / history |
| D-0003 | `jarvis-core` is prior art, not the go-forward build |
| D-0002 | `jarvis.lan` is the product surface; `chat.lan` is break-glass |
| D-0001 | Goose runs on switchable backend profiles |

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
