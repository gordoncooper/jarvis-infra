# JARVIS — mistakes we will not repeat

Each row is a thing that actually broke, and the fix. Add a row when
something breaks. Delete a row when it is no longer true.

Authority: live cluster, then [DECISIONS.md](DECISIONS.md), then `VERSION`, then
[OPERATING.md](OPERATING.md), then [REBUILD.md](REBUILD.md). **This file is
footguns**, not a veto over VERSION.

The table is the file. A new footgun is a new row, not a new essay. Dated
handover notes used to sit under the table and were easy to follow after the
surface they described was gone. They are gone. If a row no longer matches the
cluster, fix the row or delete it. Do not add a paragraph beside it.

## Never do these

| Mistake | What actually happens | Do this instead |
| --- | --- | --- |
| Put `agent.lan` on `192.168.8.11` | Port 80 is Traefik on **every** node. OpenClaw returns `proxy_attribution_required`. | DNS **and** `/etc/hosts` -> **192.168.8.16**. Browser **http://agent.lan:18789** (hostPort). |
| `command:` / `args:` on `openedai-speech-min` | Replaces `startup.sh` -> CrashLoopBackOff | Image default CMD only. Mount `/app/voices` + `/app/config`. |
| Chat-paste gzip+base64 YAML | Chat mutates the payload -> `zlib error` | Plain heredoc into a file. |
| Define a `kubectl()` guard function after `alias kubectl=` | Interactive bash expands the alias mid-parse -> syntax error, and **every guard below it is silently undefined** | `unalias kubectl k3s git` first — `~/.agent-guard.sh` does this. |
| Trust a long-lived Cursor Remote-SSH host for env changes | It keeps the env it started with. A stale `GOOSE_MODEL` survived its removal from `~/.bashrc` and would re-pin every Goose profile (defeats D-0001) | Reload the remote window after editing `~/.bashrc`; check with a fresh `bash -ic`. |
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
| Copy pins into REBUILD / README | Greenfield checks out the wrong tag | Edit `VERSION` + yaml only. Git tags are the history. |
| Retag a tag that already exists on origin | GitHub + Gitea fork | Next number is new. Never `git tag -f`. |
| Run JARVIS scripts as user `bastion` | repos missing; silent `set -e` exit | `sudo su - agent`. HOME=/home/agent |
| `set -euo pipefail` + `exit` at the `agent@` prompt | kills `su - agent`; you are `bastion@` | Wrap in a quoted heredoc |
| `ssh` inside a quoted heredoc without `-n` | ssh eats the rest of the script; paste stops after first ssh | `ssh -n` except when stdin **is** the remote program (`sudo tee`, `python3 -`) |
| Nested `ssh ...` heredoc inside an outer heredoc | same stdin eat | One-line `ssh -n host "cmd"` |
| Shrink READMEs/docs to fit chat | GitHub gets a stub | Full file, or two complete pastes. Never a summary version. |
| Skip SOPS decrypt when the age key is on USB | House-fire rebuild invents new keys | `materialize-bastion-secrets.sh` then `apply-secrets.sh`. chmod 600 files are fallback. |
| Follow deleted cutover notes as current | old v0.1 / v0.4.4 commands | `docs/REBUILD.md` only. |
| Tarball dumps of `output/` into `public/` | junk `.tgz` on home.lan | Never copy archives into `public/` or `output/static/` |
| OpenClaw image has no curl/kubectl | exec fails | `node …/prom.js` and `node …/k8s.js` |
| Goose `OPENAI_HOST: http://llm.lan` after TLS | Traefik 404 | `OPENAI_HOST: https://llm.lan` (no trailing `/v1`) |
| Goose `OPENAI_HOST: …/v1` | `/v1/v1/chat/completions` 404 | Host only, Goose adds `/v1` |
| Unpinned `curl | sh` k3s install | Newer k3s than `VERSION` | `INSTALL_K3S_VERSION` from `VERSION` in install-server / join-agents |
| `cluster_format_disks: true` on disks that already hold `/cluster` | Wipes P300 data | Greenfield only, after `identify-disks.yml` |
| Nested markdown fences inside a heredoc | Grok chat splits the copy; operator cannot paste | No triple-backtick fences inside scripts |
| `kubectl` on a node (no kubeconfig) | dial localhost:8080 | kubectl on the bastion as agent only |
| Copy kubeconfig to a laptop / Cursor | split-brain; house-fire of the API | Bastion-only. Laptop clones are caches. |
| `git push` jarvis-cluster to GitHub from a laptop | Flux never sees it (Gitea is origin) | Push from bastion `~/cluster` to git.lan |
| Bounce OpenClaw while hostPort 18789 still held | New pod Pending: “no free ports” | Scale deploy 0→1, or wait until old pod is Gone before recreate |
| Mount OpenClaw skills only on the gateway container | openai-shim `/v1/verbs` fails (missing k8s.js/prom.js) | Mount the three skill volumes on **both** gateway and openai-shim |
| Reference a constant you never defined in a rarely-hit branch | `ALLOW_NS` in `hands.py` was undefined for weeks. Only utterances with an explicit `ns/name` reached it, so every `restart deploy apps/jarvis-glass` was a silent **HTTP 500** | A branch with no test is a branch that does not work. Slice 0 of D-0033 added both |
| `IMAGE_ORCHESTRATOR_TAG=x ./scripts/install-images.sh` to build one-off | The script sources `VERSION` **after** the environment, so the override is silently discarded and you rebuild the tag already in `VERSION` — a retag, with `imagePullPolicy: Never` meaning the node now holds different bits under a tag that already shipped | There is no override. Bump `VERSION`, which is the source of truth by design. `SKIP_ORCH=1` / `SKIP_GLASS=1` / `SKIP_TESTS=1` are the only knobs |
| Let a regex capture group swallow a bare pronoun | `remember that` stored the literal fact **"that"** in promoted sqlite, and `forget that` then substring-matched every fact containing the word | A trailing demonstrative is a *referent*, not a fact. Say "which part, sir?" rather than storing it (D-0033) |
| Skin `chat.lan` or inject a HUD | `MutationObserver` on the vendor DOM loops the page. The HUD was removed | Leave Open WebUI stock (D-0039). Do not put the inject back. |
| A routed-model chip on `chat.lan` | Open WebUI rewrites every stream chunk, so the chip never showed the real model | Do not build it. |
| Exact-phrase `keyword_tier_rules`, or a live telemetry dump in the 7B prompt | The model answered cluster questions from imagination. The auto-router that held those rules is deleted | Do not add them back (D-0040). |
| `code:` as a LiteLLM model-name substring | It matched inside unrelated names and routed the turn wrong | Do not use that prefix. |
| Omit `SYSTEM` when creating the `jarvis` Ollama model | `FROM qwen2.5` inherits "You are Qwen" | `scripts/create-jarvis-ollama.sh` bakes `docs/persona.txt`. Do not skip that. |
| Put rack facts in `docs/persona.txt` | The talker recites infrastructure instead of answering | Character only. |
| Edit persona and keep talking in the old chat | The thread stays on the old identity | Start a new chat. |
| A new `open-webui.yaml` volumeMount in block style | The file is flow-style (`- { name: data, ... }`). A different indent makes Flux kustomize reject the repo, and nothing applies | Match the items already there. |
| `ssh … \| ssh … tee` for a tarball | The pipe writes an empty archive and `pipefail` aborts | `-n` on the producer. The consumer's stdin is the program only when you mean it (`sudo tee`, `python3 -`). |

## DNS / hosts

| Name | IP |
| --- | --- |
| git.lan jarvis.lan grafana.lan llm.lan chat.lan **home.lan** | 192.168.8.11 |
| agent.lan | **192.168.8.16** |
