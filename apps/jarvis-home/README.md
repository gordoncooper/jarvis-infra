# jarvis-home (command center)

One image, two routes:

| URL | Route |
|---|---|
| https://home.lan | Home (services + rack) |
| https://home.lan/status | Status floor (GPUs + nodes) |

Replaces gethomepage. **Do not** deploy `ghcr.io/gethomepage`.

## What lives where

| Piece | Repo | Path |
|---|---|---|
| Dockerfile + SSR bundle | **jarvis-infra** | `apps/jarvis-home/Dockerfile`, `apps/jarvis-home/output/` |
| Build / import | **jarvis-infra** | `scripts/install-jarvis-home.sh` |
| Deployment / Service / Ingress | **Gitea / jarvis-cluster** | `clusters/jarvis/apps/homepage.yaml` |
| DNS | router | `home.lan` → `192.168.8.11` |

`output/` **is committed**. Greenfield does not run `npm run build` on the cluster.

Image is **local only**: `docker.io/library/jarvis-home:v0.2`, `imagePullPolicy: Never`, nodeSelector `jarvis.role=apps` (apps-01).

```bash
# bastion as agent — AFTER k3s, BEFORE or immediately after Flux
~/jarvis-infra/scripts/install-jarvis-home.sh
```

Wipe of apps-01 → run that script again, then `kubectl -n apps delete pod -l app=homepage`.

v0.1 `npx srvx` never bound :3000. v0.2 CMD is `node ./node_modules/srvx/bin/srvx.mjs --prod …`.

Telemetry in v0.2 is still simulated (no Prometheus scrape yet).
