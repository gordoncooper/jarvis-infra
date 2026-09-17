# JARVIS — mistakes we will not repeat

Lived on the cluster 2026-08-30 -> 2026-09-15.

Authority: live cluster, then `VERSION`, then [OPERATING.md](OPERATING.md),
then [REBUILD.md](REBUILD.md). **This file is footguns**, not a veto over VERSION.

## Never do these

| Mistake | What actually happens | Do this instead |
| --- | --- | --- |
| Put `agent.lan` on `192.168.8.11` | Port 80 is Traefik on **every** node. OpenClaw returns `proxy_attribution_required`. | DNS **and** `/etc/hosts` -> **192.168.8.16**. Browser **http://agent.lan:18789** (hostPort). |
| `command:` / `args:` on `openedai-speech-min` | Replaces `startup.sh` -> CrashLoopBackOff | Image default CMD only. Mount `/app/voices` + `/app/config`. |
| Chat-paste gzip+base64 YAML | Chat mutates the payload -> `zlib error` | Plain heredoc into a file. |
| `kube-state-metrics:v2.14.2` | registry.k8s.io **404** | **v2.20.0** |
| `nvidia.com/gpu: 1` on an exporter | Steals the A1000 from Ollama | RuntimeClass + `NVIDIA_VISIBLE_DEVICES=all`, **no** GPU resource |
| `nvidia_gpu_exporter` AUTO fields, driver 595 | Panic: metric name contains `[us]` | `--query-field-names=uuid,name,...` — never AUTO |
| OpenClaw `gateway.allowedOrigins` | 2026.8.2: Unrecognized key | `gateway.controlUi.allowedOrigins` |
| `--bind 0.0.0.0` | Invalid --bind | Config `"bind": "lan"` |
| xAI `max_completion_tokens` | LiteLLM 400 | `drop_params` + drop `max_completion_tokens` |
| OpenClaw default SA | list nodes 403 | SA `openclaw` + ClusterRole `openclaw-readonly` |
| Homepage ConfigMap on `/app/config` | `ENOENT mkdir /app/config/logs` (500) | Obsolete. home.lan is `jarvis-home`. |
| Flux homepage before local image | `ErrImageNeverPull` on apps-01 | `install-jarvis-home.sh` **then** Flux. |
| `imagePullPolicy: Always` on jarvis-home | Docker Hub 404 | Never. Image lives in k3s containerd on **apps-01 only**. |
| `npx srvx` as image CMD | non-TTY hang; Ready never | `node ./node_modules/srvx/bin/srvx.mjs --prod` |
| Dockerfile `COPY package.json` / `node src/server.mjs` | `install-jarvis-home.sh` only tars `Dockerfile`+`output/` → docker `COPY failed` | `COPY output/` + in-image `srvx --prod`. HUD `src/` is for later rebuild (`BUILD.md`), not the cluster build context. |
| Same tag + `imagePullPolicy: Never` | kubelet keeps old layers | Bump **image** tag in `VERSION` **and** both `homepage.yaml` files |
| Treat git tag and image tag as one number | Docs and cluster argue | `VERSION` has both. They may differ. `check-contract.sh` |
| Copy pins into REBUILD / README / PHASE | Greenfield checks out the wrong tag | Edit `VERSION` + yaml only. History stays frozen. |
| Retag a tag that already exists on origin | GitHub + Gitea fork | Next number is new. Never `git tag -f`. |
| Run JARVIS scripts as user `bastion` | repos missing; silent `set -e` exit | `sudo su - agent`. HOME=/home/agent |
| `set -euo pipefail` + `exit` at the `agent@` prompt | kills `su - agent`; you are `bastion@` | Wrap in a quoted heredoc |
| `ssh` inside a quoted heredoc without `-n` | ssh eats the rest of the script; paste stops after first ssh | Always `ssh -n` |
| Nested `ssh ...` heredoc inside an outer heredoc | same stdin eat | One-line `ssh -n host "cmd"` |
| Shrink READMEs/docs to fit chat | GitHub gets a stub | Full file, or two complete pastes. Never a summary version. |
| Skip SOPS decrypt when the age key is on USB | House-fire rebuild invents new keys | `materialize-bastion-secrets.sh` then `apply-secrets.sh`. chmod 600 files are fallback. |
| Follow `GITHUB-CUTOVER.md` as current | old v0.1 / v0.4.4 commands | `docs/REBUILD.md`. Cutover is history. |
| Tarball dumps of `output/` into `public/` | junk `.tgz` on home.lan | Never copy archives into `public/` or `output/static/` |
| OpenClaw image has no curl/kubectl | exec fails | `node …/prom.js` and `node …/k8s.js` |
| Goose `OPENAI_HOST: http://llm.lan` after TLS | Traefik 404 | `OPENAI_HOST: https://llm.lan` (no trailing `/v1`) |
| Goose `OPENAI_HOST: …/v1` | `/v1/v1/chat/completions` 404 | Host only, Goose adds `/v1` |
| Unpinned `curl | sh` k3s install | Newer k3s than `VERSION` | `INSTALL_K3S_VERSION` from `VERSION` in install-server / join-agents |
| `cluster_format_disks: true` on disks that already hold `/cluster` | Wipes P300 data | Greenfield only, after `identify-disks.yml` |

## DNS / hosts

| Name | IP |
| --- | --- |
| git.lan jarvis.lan grafana.lan llm.lan chat.lan **home.lan** | 192.168.8.11 |
| agent.lan | **192.168.8.16** |

## Open WebUI HUD

- Do not `MutationObserver` + rewrite text with `characterData` — infinite loop, “Page Unresponsive”.
- Tailwind class selectors (`self-center.font-medium`) miss 0.11.3; key off the **JARVIS** text node.
- Sidebar expand remounts the brand; one-shot `setTimeout` is not enough — `childList` only.
- `ENABLE_*` env is not enough when PersistentConfig already wrote sqlite (`task.follow_up.enable`).
- Piped `ssh -n … | ssh -n tee` writes empty tarballs and `pipefail` aborts at hostPaths. `-n` only on the producer.
- Glass freeze v0.4.30: do not retune SYSTEM / LIVE_RE / keyword_tier_rules / HUD CSS unless chat.lan regresses. Router keywords are literal (`are the nodes up` != `are nodes ready`). OpenClaw agent timeout 180s (90s timed out cold Hands). Secret phrase is briefing blue-banana-42, not learned.md silver-orbit-3.

- Laptop `jarvis-wake.py` is transport only (mic → Voice chat → speaker). Never special-case questions on the laptop.
- Wall clock is one `[clock …]` line from the OWUI filter (America/Los_Angeles) on every chat.lan turn. Do not inject per-question facts in the listener.
- Listener commands (stop/pause/resume/repeat/mute/status) run after STT and must not be POSTed to chat.lan.
- openWakeWord CUDA warning on the laptop is fine (CPUExecutionProvider).
- Adaptive silence (`0.22 * peak`) can still hit MAX_UTTER (~8s) in a noisy room; not a command bug.
- Do not intent-gate a LIVE telemetry dump into the 7B prompt. Clock is always-on; live numbers are Hands or home.lan.

- chat.lan does not show a routed-model chip. Open WebUI rewrites every stream chunk to model=jarvis, so the child (ollama/jarvis vs jarvis-hands) never reaches the browser. Do not spend cycles on a HUD chip for this.
- Do not unify chat.lan prefixes with LiteLLM keyword_tier_rules. Router = automatic; `jarvis_route` = explicit override. `code:` as a LiteLLM substring is a landmine.
