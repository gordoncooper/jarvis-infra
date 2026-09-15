# jarvis-home (command center)

One image. Replaces gethomepage. **Do not** deploy `ghcr.io/gethomepage`.

Pins live in [`../../VERSION`](../../VERSION) (`IMAGE` / `IMAGE_TAG`).
`scripts/install-jarvis-home.sh` sources that. Do not copy those numbers here.

| URL | Route |
| --- | --- |
| https://home.lan | Home — services + rack + event stream. **Click a tile** for a dossier overlay. |
| https://home.lan/status | Status — GPUs, events, workloads, nodes. Same overlays. |
| https://home.lan/api/telemetry | Prometheus + k8s events + pods-by-node JSON |
| https://home.lan/health | `{status:true}` for the probe |

## What lives where

| Piece | Repo | Path |
| --- | --- | --- |
| Pins | **jarvis-infra** | `VERSION` |
| HUD source | **jarvis-infra** | `apps/jarvis-home/src/` (TanStack HUD) |
| Image payload | **jarvis-infra** | `apps/jarvis-home/output/` + `Dockerfile` |
| Import | **jarvis-infra** | `scripts/install-jarvis-home.sh` |
| Deploy / Ingress / RBAC | **Gitea** | `clusters/jarvis/apps/homepage.yaml` |
| DNS | router | `home.lan` → `192.168.8.11` |

`output/` **is committed**. Greenfield does **not** `npm run build` on the cluster.

Dockerfile: `COPY output/`, then `srvx --prod` (installed in-image). **Not**
`npx srvx`. **Not** `COPY package.json` / `node src/server.mjs`.
`install-jarvis-home.sh` tars **only** `Dockerfile` + `output/` onto apps-01.

Image: `imagePullPolicy: Never`, `nodeSelector: jarvis.role=apps` (apps-01),
SA `homepage` (get/list **events**, Flux CRs, **pods**, **nodes**).

## Dossiers

Click cluster / GPU / service / rack tiles (Esc or backdrop to close).
Node overlay: role, IP, CPU/RAM/disk/load, kernel, **pods on that node**.
In-cluster telemetry is **LIVE** (Prometheus). Out of cluster the same UI is **SIM**.

## Ship a new image

1. Refresh `output/` if the HUD source changed (`BUILD.md`).
2. Bump `IMAGE_TAG` / `IMAGE` in `VERSION` **and** both `homepage.yaml` files.
3. `./scripts/check-contract.sh`
4. `./scripts/install-jarvis-home.sh` **before** Flux.
5. `kubectl -n apps delete pod -l app=homepage`

Never retag git. `GIT_TAG` and `IMAGE_TAG` are independent.

## Image history (do not retag)

| Image | Notes |
| --- | --- |
| v0.1 | `npx srvx` never bound :3000 |
| v0.2 | srvx `--prod`. Tiles simulated. |
| v0.4.5 | Prometheus scrape. |
| v0.4.8 | 10-min event stream + events RBAC |
| v0.4.9 | HUD dossiers + pods-by-node. Payload still `output/` + srvx. |

Living pin is [`VERSION`](../../VERSION), not this table.
