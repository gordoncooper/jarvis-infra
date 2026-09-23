# JARVIS — how to work in this repo

You are the homelab copilot, on the bastion as user `agent`.

This file is the operating contract: where to push, what must not be done, and
what outranks what. It is not a catalog of product choices. Those are dated
entries in [`docs/DECISIONS.md`](docs/DECISIONS.md). Footguns already paid for
are [`docs/LESSONS.md`](docs/LESSONS.md). How the product is built is
`~/jarvis-app` (`AGENTS.md`, then `docs/WORKFLOW.md`).

Do not describe current deployment here. Ask the cluster.

## What outranks what

When two sources disagree, the higher one wins.

1. **The live cluster.** `kubectl`, node SSH, NFS.
2. **[`docs/DECISIONS.md`](docs/DECISIONS.md).** Dated calls. Outranks prose.
3. **Gitea** `http://git.lan/jarvis/cluster.git` — what Flux reconciles.
4. **`VERSION`** — source it. Never retype a pin into prose.
5. **[`docs/LESSONS.md`](docs/LESSONS.md).**
6. Everything else in `docs/`. Stale until the cluster agrees.

GitHub is a cache. It can lag the bastion. It is never Flux's origin.

## Where you are

If you have a shell on the bastion as `agent`, do the work. Do not hand the
operator a script for something you can run.

No shell (a laptop, a web chat): no kubectl, no cluster push. `kubectl` and
the kubeconfig stay on the bastion. Cluster nodes have no kubeconfig.

If you are user `bastion`, stop. `sudo su - agent` first. `HOME=/home/agent`.

`scripts/copilot-whereami.sh` prints `MODE=` and `HANDS=` when you are unsure.

## Where a change goes

| Change | Clone | Push to |
| --- | --- | --- |
| Metal, Ansible, scripts, docs, SOPS | `~/jarvis-infra` | GitHub `jarvis-infra` |
| Orchestrator, glass, themes | `~/jarvis-app` | GitHub `jarvis-app` |
| Flux YAML | `~/cluster` | Gitea `git.lan/jarvis/cluster.git` |

- Never point Flux at GitHub. Never push `~/cluster` to GitHub as if it were origin.
- Never `kubectl apply`. Flux owns cluster state. The documented exception is `apps/jarvis-noc/install-noc.sh`.
- Never retag. The next snapshot is a new `GIT_TAG`. Never `git tag -f`.
- One coherent change per commit. Do not mix unrelated work.

Each repo has one rules file, `AGENTS.md` at its root. Do not add a
`CLAUDE.md` or a `.cursor/rules` file that restates it. A `CLAUDE.md` silently
outranks this file for Claude Code.

`.claude/settings.json` is not a second contract. It is the deny-rule set.
Keep it committed.

## Hard rules

- Do not widen OpenClaw RBAC unless Gordon named the verbs. Read the live Role first.
- Never dump Secret `.data`, Helm blobs, SOPS ciphertext, or key files.
- Do not commit `learned.md`.
- Do not scaffold a new app, a new repo, or an App Builder preview for a side project.
- Do not theme `chat.lan`. It is break-glass.
- Prefer the vendor knob — LiteLLM config, an OpenClaw skill, a Kubernetes Role — over a new adapter. One adapter per gap.
- If unsure, stop and ask.
- Change this file or `DECISIONS.md` only in a session Gordon is watching.
- If a change moves where agents should start (repo, ship path, skip-list), update `docs/MAP.md` in the same commit. Do not refresh MAP for decisions, lessons, or live status.

## What to open

Stop as soon as the task is clear.

1. This file.
2. The routing index: [`docs/MAP.md`](docs/MAP.md). Pick the one row for this task. Do not read the map back in the answer.
3. The index in [`docs/DECISIONS.md`](docs/DECISIONS.md), then only the entries the task touches. Not the whole log.
4. `scripts/copilot-whereami.sh` if you are not sure which machine you are on.
5. One task file, if the work is ops: [`OPERATING`](docs/OPERATING.md), [`REBUILD`](docs/REBUILD.md), or [`RESTORE`](docs/RESTORE.md).

[`docs/VISION.md`](docs/VISION.md) is what we are building toward. Read it when the task is direction, not when the task is a fix.

`docs/persona.txt` and `docs/briefing.md` are fed to models at runtime. They are not instructions for you.

## Don't

- Invent a second bible. A new call is a new entry in `DECISIONS.md`.
- Write live status into a contract or a decision. Status is the cluster.
- Add regex intent rules, keyword tier rules, or a filter that rewrites English.
- Rebuild a vendor feature we already have.
- Trust a doc because it sounds confident. Check the date, then the cluster.
