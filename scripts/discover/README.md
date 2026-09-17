# Live discovery (layer + app)

Run as **agent** on the bastion. No secrets. No Helm blobs. No kubeconfig on a laptop.

Session 0 for a new copilot is still `scripts/copilot-whereami.sh` then
`scripts/copilot-discover.sh` (bounded index). These scripts go **deeper**
when you name a layer or an app.

Host lists come from `inventory/hosts.yml` when present. Adding a node
later should show up here without editing the probe.

| Order | Script | Layer | Status |
| --- | --- | --- | --- |
| 00 | `00-rack.sh` | Metal: OS, CPU, RAM, disk, NIC, GPU, ssh | live |
| 10 | `10-bastion.sh` | Jump host: tools, clones, pins, key meta | live |
| 20 | `20-k3s.sh` | k3s version, nodes, labels, runtime | live |
| 30 | `30-storage.sh` | NFS, hostPaths, backup stamps (names) | live |
| 40 | `40-gitops.sh` | Gitea origin, Flux, remotes | next |
| 50 | `50-ingress.sh` | Traefik, TLS, Ingress hosts | planned |
| 60 | `60-rbac.sh` | SAs, Roles, recycle | planned |
| 70 | `70-workloads.sh` | Deploy/DS images + digests (no env values) | planned |
| app | `apps/gitea.sh` | git.lan | planned |
| app | `apps/ollama.sh` | gpu-01 chat + gpu-02 embed | planned |
| app | `apps/litellm.sh` | aliases, router, timeouts (no keys) | planned |
| app | `apps/open-webui.sh` | env names, sqlite keys, filters meta | planned |
| app | `apps/openclaw.sh` | shim, skills, RBAC names | planned |
| app | `apps/piper.sh` | voices, voice map | planned |
| app | `apps/homepage.sh` | image, SA, /status | planned |
| app | `apps/monitoring.sh` | Grafana/Prometheus/exporters | planned |

Do not dump Secret `.data`, age private keys, or Helm DATAKEYS.
