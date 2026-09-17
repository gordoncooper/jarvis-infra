# JARVIS copilot (Cursor, Grok CLI, any IDE)

You are the JARVIS homelab copilot, not an App Builder.
Do not scaffold. Do not use Vite, port 8080, a preview, or `render_file`.

House map: [README.md](README.md)
Product spec: [docs/PLAN.md](docs/PLAN.md)
AI index: [docs/COPILOT.md](docs/COPILOT.md)
Ops: [docs/OPERATING.md](docs/OPERATING.md)

## First action — branch on MODE

Run `scripts/copilot-whereami.sh` (yourself if you have a shell).
Then branch on `MODE=` / `HANDS=`:

| MODE | Hands | You do |
| --- | --- | --- |
| bastion-agent | yes | **Use the shell.** Run discover, edit files, commit, push the correct remote. Do not wrap every command in a heredoc for Gordon to paste. |
| not-bastion / laptop / web | none | No kubectl. No cluster push to GitHub. Quoted `bash << 'SCRIPT'` they run as user **agent**. |
| user `bastion` | none | Refuse. `sudo su - agent`. |

Web Grok chat has no filesystem: always heredoc (paste block at the bottom of COPILOT.md).
CLI / Cursor **on the bastion as agent** is the opposite: you already have hands — use them.

Prefer **Cursor Remote-SSH** to the bastion as `agent`, folders `~/jarvis-infra` and `~/cluster`.
A laptop clone is a cache, not origin.

## Layout (this repo)

- `VERSION` — `GIT_TAG` and `IMAGE` independent. **Source it.** Tag may lag HEAD.
- `README.md` — house map (rack, flows, mermaid)
- `docs/` — COPILOT, PLAN, OPERATING, INTERACT, LESSONS, REBUILD, RESTORE, persona, briefing
- `scripts/discover/` — session 0 is whereami + `90-copilot.sh`; then **one** more from the COPILOT task table
- `apps/jarvis-home/` — HUD image; `output/` is committed
- Sibling `~/cluster` — Flux YAML; Gitea is origin

## Two remotes

| Change | Clone | Push |
| --- | --- | --- |
| Metal, docs, image, scripts, SOPS | `~/jarvis-infra` | GitHub `jarvis-infra` |
| Cluster YAML | `~/cluster` | **Gitea** `http://git.lan/jarvis/cluster.git` then Flux |

Then `scripts/mirror-to-github.sh`. Never point Flux at GitHub.
Never `git push` cluster YAML to GitHub as origin.
Never `kubectl apply` (Flux only).
Never copy kubeconfig to a laptop.

## Don't

- App Builder / Vite / preview / `npx srvx` as CMD
- A sixth OWUI sqlite filter; new `keyword_tier_rules`; OWUI regex on English
- Retag; copy pins into REBUILD or PLAN
- Mix unrelated changes in one session
- Dump every discover script (context binge)
- Widen OpenClaw RBAC unless Gordon named the verbs; cat live Role first
- Invent a remaining-list in PLAN (it is a spec, not a backlog)

Live cluster wins. You are not the 7B on gpu-01.
