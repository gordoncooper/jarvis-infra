# JARVIS Phase 9 — OpenClaw  WORKING 2026-09-08

See [docs/LESSONS.md](docs/LESSONS.md).

## What is running

- Image `ghcr.io/openclaw/openclaw:2026.8.2` on **apps-01**
- `hostPort: 18789`, bind `lan`, SA `openclaw` (read-only)
- UI: **http://agent.lan:18789**  (DNS 192.168.8.16)
- Ingress `agent.lan:80` exists but **must not be used** (`proxy_attribution_required`)

## Pair

```bash
kubectl -n agents exec deploy/openclaw -- openclaw devices list
kubectl -n agents exec deploy/openclaw -- openclaw devices approve <id>
```

Pod recycle (Flux, crash, node reboot) → pair again.

## GitOps

`clusters/jarvis/agents/{openclaw.yaml,rbac.yaml,kustomization.yaml}`
Parent overlay includes `- agents`.
