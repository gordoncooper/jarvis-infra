# Phase 21 — JARVIS command center

Replaced gethomepage. `https://home.lan` is Home; `/status` is the floor.

**Live 2026-09-14 22:00 PDT** — Gitea `021d7a3`. Image
`docker.io/library/jarvis-home:v0.2` imported on apps-01
(`imagePullPolicy: Never`). Pod Ready 1/1. `home 200` / `status 200`.
srvx 0.11.21 `--prod` on :3000.

Rebuild: `~/jarvis-infra/scripts/install-jarvis-home.sh` **then**
`~/jarvis-infra/scripts/fix-homepage-v0.2.sh` (image import **before**
Flux). Run as user **agent**.

v0.1 (`npx srvx`) never bound :3000 — Ready stayed false, home.lan 503.
Telemetry is still simulated; Prometheus scrape is a follow-up.
