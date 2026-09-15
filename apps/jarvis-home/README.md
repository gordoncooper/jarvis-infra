# jarvis-home (command center)

One image, two routes. Replaces gethomepage. **Do not** deploy `ghcr.io/gethomepage`.

| URL | Route |
| --- | --- |
| https://home.lan | Home — services + rack |
| https://home.lan/status | Status floor — GPUs + nodes |
| https://home.lan/api/telemetry | Prometheus snapshot (JSON) |

## What lives where

| Piece | Repo | Path |
| --- | --- | --- |
| Dockerfile + SSR bundle | **jarvis-infra** | `apps/jarvis-home/Dockerfile`, `output/` |
| Build / import | **jarvis-infra** | `scripts/install-jarvis-home.sh` |
| Deployment / Service / Ingress | **Gitea / jarvis-cluster** | `k8s/apps/homepage.yaml` |
| DNS | router | `home.lan` → `192.168.8.11` |

`output/` **is committed**. Greenfield does not `npm run build` on the cluster.

Image is local only: `docker.io/library/jarvis-home:v0.4.5`, `imagePullPolicy: Never`,
nodeSelector `jarvis.role=apps` (apps-01).

| Image | Git | Notes |
| --- | --- | --- |
| v0.1 | — | `npx srvx` never bound :3000 |
| v0.2 | v0.4.4 | srvx `--prod`. Tiles simulated. |
| v0.4.5 | v0.4.5 | Prometheus scrape. `PROMETHEUS_URL`. |

```bash
JARVIS_HOME_TAG=v0.4.5 ~/jarvis-infra/scripts/install-jarvis-home.sh
```

Pod scrapes `http://prometheus.monitoring.svc:9090` (same URL Grafana uses).
Header **LIVE** or **SIM**. Bastion has no node-exporter (not a k3s node).
