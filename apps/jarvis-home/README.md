# jarvis-home (command center)

One image, two routes:

| URL | Route |
|---|---|
| https://home.lan | Home (services + rack) |
| https://home.lan/status | Status floor (GPUs + nodes) |
| https://home.lan/api/telemetry | Prometheus snapshot (JSON) |

Replaces gethomepage. **Do not** deploy `ghcr.io/gethomepage`.

## What lives where

| Piece | Repo | Path |
|---|---|---|
| Dockerfile + SSR bundle | **jarvis-infra** | `apps/jarvis-home/Dockerfile`, `apps/jarvis-home/output/` |
| Build / import | **jarvis-infra** | `scripts/install-jarvis-home.sh` |
| Deployment / Service / Ingress | **Gitea / jarvis-cluster** | `clusters/jarvis/apps/homepage.yaml` |
| DNS | router | `home.lan` → `192.168.8.11` |

`output/` **is committed**. Greenfield does not run `npm run build` on the cluster.

Image is **local only**, `imagePullPolicy: Never`, nodeSelector `jarvis.role=apps` (apps-01).

| Image | Notes |
|---|---|
| `jarvis-home:v0.1` | `npx srvx` — never bound :3000, home.lan 503 |
| `jarvis-home:v0.2` | **live at git v0.4.4** — srvx `--prod`. Tiles simulated. |
| `jarvis-home:v0.4.5` | Prometheus scrape → Home/Status tiles. `PROMETHEUS_URL`. |


```bash
# bastion as agent — AFTER k3s, BEFORE or immediately after Flux
JARVIS_HOME_TAG=v0.4.5 ~/jarvis-infra/scripts/install-jarvis-home.sh

```

Wipe of apps-01 → run that script again, then `kubectl -n apps delete pod -l app=homepage`.

Telemetry: the pod scrapes `http://prometheus.monitoring.svc:9090` (same URL Grafana uses). If scrape fails, the UI keeps last/sim values and the header says **SIM** instead of **LIVE**. Bastion has no node-exporter (not a k3s node).
