# Live discovery (layer + app)

Run as **agent** on the bastion. No secrets. No Helm blobs. No kubeconfig on a laptop.

Session 0 for a new copilot: whereami + `90-copilot.sh` only (see ../../AGENTS.md).
Host lists come from inventory/hosts.yml when present.

| Order | Script | Layer | Status |
| --- | --- | --- | --- |
| 00 | 00-rack.sh | Metal: OS, CPU, RAM, disk, NIC, GPU, ssh | live |
| 10 | 10-bastion.sh | Jump host: tools, clones, pins, key meta | live |
| 20 | 20-k3s.sh | k3s version, nodes, labels, runtime | live |
| 30 | 30-storage.sh | NFS, hostPaths, backup stamps (names) | live |
| 40 | 40-gitops.sh | Gitea origin, Flux, remotes | live |
| 50 | 50-ingress.sh | Traefik, TLS, Ingress hosts | live |
| 55 | 55-rbac.sh | SAs, Roles, Bindings (names + resource verbs) | live |
| 60 | 60-workloads.sh | Deploy/DS images, homepage pin, product pins | live |
| 70 | 70-inference.sh | Ollama, LiteLLM ids, GPU VRAM | live |
| 80 | 80-memory.sh | learned.md meta, product sqlite sizes, knowledge names | live |
| 90 | 90-copilot.sh | Doc presence + check-contract | live |
| app | apps/jarvis.sh | orchestrator + glass pins, /health | live |
| app | apps/homepage.sh | image, SA, /status keys | live |
| app | apps/openclaw.sh | shim, skills, RBAC names | live |
| app | apps/gitea.sh | git.lan | live |
| app | apps/ollama.sh | gpu-01 chat + gpu-02 embed | live |
| app | apps/litellm.sh | aliases, router (no keys) | live |
| app | apps/open-webui.sh | env names, sqlite names, HUD must be absent | live |
| app | apps/piper.sh | voices, voice map | live |
| app | apps/monitoring.sh | Grafana/Prometheus/exporters | live |

Do not dump Secret .data, age private keys, or Helm DATAKEYS.
The old one-shot copilot-discover.sh was removed.
