# Rebuild output/ from git (later)

This HUD is a TanStack Start app. `output/` is the Nitro/Vercel-shaped bundle
the Dockerfile copies (`functions/__server.func` + `static` + srvx).

## After this drop is committed

Source of truth:

- `apps/jarvis-home/src/lib/hud/`  UI + Prometheus/k8s scrape
- `apps/jarvis-home/src/routes/`   `/` `/status` `/health` `/api/telemetry`
- `apps/jarvis-home/src/styles.css` teal HUD tokens
- `apps/jarvis-home/output/`       last shipped bundle (greenfield does not npm-build on the cluster)

To refresh `output/` you need a Node 22 TanStack Start + Tailwind v4 workspace
(the Grok App Builder tree this was built in, or a similar `vite` +
`@tanstack/react-start` + `nitro` setup):

  1. Copy `src/lib/hud`, the HUD routes, `styles.css`, fonts into that workspace
  2. `npm run build`  →  `.vercel/output/`
  3. Replace `apps/jarvis-home/output/` with that directory
  4. `./scripts/install-jarvis-home.sh`
  5. Bump IMAGE_TAG (never retag). Flux Recreate.

Do not copy pin numbers into REBUILD.md. Homepage: Never, apps-01, SA homepage.
