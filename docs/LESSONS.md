# JARVIS — mistakes we will not repeat

Lived on the cluster 2026-08-30 → 2026-09-08. If a future playbook
contradicts this file, **this file wins**.

## Never do these

| Mistake | What actually happens | Do this instead |
|---|---|---|
| Put `agent.lan` on `192.168.8.11` | Port 80 is Traefik on **every** node. OpenClaw returns `proxy_attribution_required`. | DNS **and** `/etc/hosts` → **192.168.8.16**. Browser **http://agent.lan:18789** (hostPort). |
| `command:` / `args:` on `openedai-speech-min` | Replaces `startup.sh` → CrashLoopBackOff | Image default CMD only. Mount `/app/voices` + `/app/config`. |
| Chat-paste gzip+base64 YAML | Chat mutates the payload → `zlib error` | Plain `cat > file.yaml << 'EOF'`. |
| `kube-state-metrics:v2.14.2` | registry.k8s.io **404** | **v2.20.0** |
| `nvidia.com/gpu: 1` on an exporter | Steals the A1000 from Ollama | RuntimeClass + `NVIDIA_VISIBLE_DEVICES=all`, **no** GPU resource |
| `nvidia_gpu_exporter` AUTO fields, driver 595 | Panic: metric name contains `[us]` | `--query-field-names=uuid,name,...` — never AUTO, never `clocks_event_reasons*` |
| OpenClaw `gateway.allowedOrigins` | 2026.8.2: Unrecognized key | `gateway.controlUi.allowedOrigins` |
| `--bind 0.0.0.0` | Invalid --bind | Config `"bind": "lan"` |
| xAI `max_completion_tokens` | LiteLLM 400 | `drop_params` + drop `max_completion_tokens` |
| OpenClaw default SA | list nodes 403 | SA `openclaw` + ClusterRole `openclaw-readonly` |
| User Settings → Audio for Piper | Only Default / Kokoro.js | **https://chat.lan/admin/settings** → TTS OpenAI |
| Waveform next to the mic on HTTP | Permission denied (getUserMedia) | HTTPS. TTS = speaker on the **reply** |
| Grafana 14574 Host empty | Variables query `nvidia_smi_index` | Query `nvidia_smi_gpu_info` **or** export `index` in nvidia-smi fields |
| Grafana 14574 type Host every time | Variables not saved / Refresh off | Settings → Variables: Refresh = On dashboard load; Save dashboard |
| Homepage ConfigMap on `/app/config` | `ENOENT mkdir /app/config/logs` (500) | **Obsolete.** home.lan is `jarvis-home`, not gethomepage. |
| Flux homepage before local image | `ErrImageNeverPull` on apps-01 | `./scripts/install-jarvis-home.sh` **then** Flux. `imagePullPolicy: Never`. |
| `imagePullPolicy: Always` on jarvis-home | Docker Hub 404 | Never. Image lives in k3s containerd on **apps-01 only**. |
| `npx srvx` as image CMD | non-TTY npx prompts/hangs; Ready never; :3000 connection refused | `node ./node_modules/srvx/bin/srvx.mjs --prod …` (v0.2) |
| Same tag + `imagePullPolicy: Never` | kubelet keeps old layers after rebuild | Bump tag (`v0.2`) **after** import, then Flux |
| Run JARVIS scripts as user `bastion` | `~/jarvis-infra` and `~/cluster` missing; `set -e` + `test -d` exits with **no error text** | `sudo su - agent`. HOME must be `/home/agent`. |
| Inline `set -euo pipefail` with no echos | Failed `test -d` looks like a no-op | `bash ~/jarvis-infra/scripts/fix-homepage-v0.2.sh` (prints who/paths) |

| OpenClaw image has no curl/kubectl | exec fails | `node …/prom.js` and `node …/k8s.js` |
| `k3s etcd-snapshot save` Unknown flag --tls-san | Snapshot CLI ignores **server** keys | Ignore; snapshot still saves to `/mnt/nfs/snapshots` |
| Goose `OPENAI_HOST: http://llm.lan` after TLSStore | Traefik `404 page not found` | `OPENAI_HOST: https://llm.lan` (no trailing `/v1`) |
| Goose `OPENAI_HOST: …/v1` | `/v1/v1/chat/completions` 404 | Host only, Goose adds `/v1` |

## DNS / hosts

| Name | IP |
|---|---|
| git.lan jarvis.lan grafana.lan llm.lan chat.lan **home.lan** | 192.168.8.11 |
| agent.lan | **192.168.8.16** |

