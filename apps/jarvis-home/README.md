# jarvis-home (command center)

One image, two routes. Replaces gethomepage. **Do not** deploy `ghcr.io/gethomepage`.

Current pin is **not** in this file. It lives in [`../../VERSION`](../../VERSION)
(`IMAGE` / `IMAGE_TAG`). `scripts/install-jarvis-home.sh` sources that.

| URL | Route |
| --- | --- |
| https://home.lan | Home — services + rack + compact event stream |
| https://home.lan/status | Status — GPUs + 10-min event stream + nodes |
| https://home.lan/api/telemetry | Prometheus snapshot (JSON) + events |

## What lives where

| Piece | Repo | Path |
| --- | --- | --- |
| Pins | **jarvis-infra** | `VERSION` |
| Dockerfile + SSR bundle | **jarvis-infra** | `apps/jarvis-home/Dockerfile`, `output/` |
| Build / import | **jarvis-infra** | `scripts/install-jarvis-home.sh` |
| Deployment / Service / Ingress / events RBAC | **Gitea** | `clusters/jarvis/apps/homepage.yaml` |
| DNS | router | `home.lan` -> `192.168.8.11` |

`output/` **is committed**. Greenfield does not `npm run build` on the cluster.

Image is local only: `imagePullPolicy: Never`, nodeSelector `jarvis.role=apps`
(apps-01), SA `homepage` (list Events + Flux CRs).

## Image history (do not retag)

| Image | First git tag that shipped it | Notes |
| --- | --- | --- |
| v0.1 | — | `npx srvx` never bound :3000 |
| v0.2 | v0.4.4 | srvx `--prod`. Tiles simulated. |
| v0.4.5 | v0.4.5 | Prometheus scrape. `PROMETHEUS_URL`. |
| v0.4.8 | v0.4.8 | 10-min event stream + events RBAC |

Living image pin is [`VERSION`](../../VERSION), not this table.

```bash
~/jarvis-infra/scripts/install-jarvis-home.sh
```

Pod scrapes `http://prometheus.monitoring.svc:9090` (same URL Grafana uses).
Header **LIVE** or **SIM**. Bastion has no node-exporter (not a k3s node).
Git tag and image tag are independent — bump `IMAGE_TAG` in `VERSION` **and**
both `homepage.yaml` files together, then `check-contract.sh`.
