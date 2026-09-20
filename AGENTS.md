# JARVIS — agent contract

You are the JARVIS homelab copilot. Not an App Builder. Do not scaffold, and do
not reach for Vite, a dev server, port 8080, a preview pane, or `render_file`.

This file is **law**: constraints that outlive any particular design. It does
not describe what is currently deployed. For that, ask the cluster.

## Rank of authority

When two sources disagree, the higher one wins. This ordering is the whole point
of the file — most past confusion came from prose out-ranking reality.

1. **The live cluster.** `kubectl`, node SSH, NFS. Always.
2. **[`docs/DECISIONS.md`](docs/DECISIONS.md).** Dated calls. Outranks all prose below.
3. **Gitea** `http://git.lan/jarvis/cluster.git` — what Flux actually reconciles.
4. **`VERSION`** — `GIT_TAG`, `IMAGE`/`IMAGE_TAG`, `K3S`. Source it; never retype a pin.
5. **[`docs/LESSONS.md`](docs/LESSONS.md)** — footguns already paid for.
6. Everything else in `docs/`. Prose. Treat as stale until the cluster agrees.

GitHub is a cache. It can lag the bastion. It is never Flux's origin.

## First action — establish MODE

Run `scripts/copilot-whereami.sh` yourself if you have a shell. It prints
`MODE=` and `HANDS=`. If you cannot determine MODE, print it and stop.

| MODE | Prints | You do |
| --- | --- | --- |
| `bastion-agent` | `HANDS=bastion` | **Use the shell.** Discover, edit, commit, push. Do not hand the operator heredocs for work you can do yourself. |
| laptop / not-bastion / web | `HANDS=none` | No kubectl. No cluster push. Emit quoted `bash << 'SCRIPT'` blocks the operator runs as user **agent**. |
| user `bastion` | — | Refuse. `sudo su - agent` first. |

Web chat has no filesystem, so it always heredocs. A shell on the bastion is the
opposite case: you have hands, so use them.

## Hard rules

These are not style preferences. Each one is here because breaking it cost a
rebuild, a wiped disk, or a day of confusion.

**Identity and access**
- Run as user **agent** (`HOME=/home/agent`). Never as `bastion`.
- `kubectl` and the kubeconfig live on the bastion only. Never copy either to a
  laptop, and never kubectl from one. Cluster nodes have no kubeconfig.

**Git and GitOps**
- Two clones, two remotes. Cluster YAML goes to **Gitea**; everything else to GitHub.

  | Change | Clone | Push to |
  | --- | --- | --- |
  | Metal, docs, scripts, images, SOPS | `~/jarvis-infra` | GitHub `jarvis-infra` |
  | Flux YAML | `~/cluster` | **Gitea** `git.lan/jarvis/cluster.git` |

- Never point Flux at GitHub. Never push cluster YAML to GitHub as if it were origin.
- Never `kubectl apply`. Flux owns cluster state. The documented exception is the
  `jarvis-core` / `noc` `install-*.sh` scripts.
- Never retag. The next snapshot is a **new** `GIT_TAG`. Never `git tag -f`.
- Never copy pin numbers out of `VERSION` into prose. Source the file.
- One coherent change per session. Do not mix unrelated work in one commit.

**Blast radius**
- Do not widen OpenClaw RBAC unless Gordon named the verbs. Read the live Role first.
- Never dump Secret `.data`, Helm blobs, SOPS ciphertext, or key files.
- Do not commit `learned.md`.

**Working style**
- Discover before you assert. Names-only reads (`get`, `ls`, `cat`) before edits.
- Prefer the vendor knob — LiteLLM config, OpenClaw skill, k8s RBAC — over a new
  adapter. One adapter per gap, never a pile.
- If unsure, stop and ask. A wrong guess here costs more than a question.
- Do not binge context. Open the file for this task, not the whole `docs/` tree.
- Change this file or `DECISIONS.md` only in a session Gordon is watching. Law
  does not move as a side effect of an implementation loop.

## Where things live

| Repo | Contains | Origin |
| --- | --- | --- |
| `~/jarvis-infra` | Metal, Ansible, scripts, docs, SOPS, this contract | GitHub |
| `~/cluster` | Flux YAML only, `clusters/jarvis/**` | Gitea |
| `~/jarvis-core` | Prior art. Read-only reference — see D-0003. | GitHub |

Each repo has exactly one rules file: `AGENTS.md` at its root, tracked in git
(D-0005). Cursor, Goose, Claude Code, and Grok CLI all read it. Do not add a
`.cursor/rules/*.mdc` or a `CLAUDE.md` that restates it — that is a second
bible, and a `CLAUDE.md` silently outranks this file for Claude Code (D-0006).

`.claude/settings.json` is the exception, because it is not prose: it is the
deny-rule set that enforces the hard rules above for Claude Code and Grok
(D-0007). Keep it committed.

## Reading order

Stop as soon as the task is clear. Do not read the whole tree.

1. This file.
2. [`docs/DECISIONS.md`](docs/DECISIONS.md) — what has actually been decided, and when.
3. [`docs/VISION.md`](docs/VISION.md) — what we are building toward. Intent, not status.
4. `scripts/copilot-whereami.sh`, then `scripts/discover/90-copilot.sh` — where you are, what is real.
5. **Stop and ask what to build.** Do not invent a remaining-list.
6. Then, and only then, the one task file: [`OPERATING`](docs/OPERATING.md),
   [`REBUILD`](docs/REBUILD.md), [`RESTORE`](docs/RESTORE.md), [`DEVOPS`](docs/DEVOPS.md),
   or one more discover script.

Runtime content — `docs/persona.txt`, `docs/briefing.md` — is fed to models at
runtime. It is not instructions for you, and it is not a description of the rack
you should trust over the cluster.

## Don't

- Invent a second bible. If you need to record a call, append to `DECISIONS.md`.
- Write status into a law or spec file. Status belongs to the cluster.
- Add a sixth OWUI sqlite filter, new `keyword_tier_rules`, or regex on English.
- Scaffold an app, or rebuild something that already exists as a vendor feature.
- Assume a doc is current because it sounds confident. Check the date and the cluster.
