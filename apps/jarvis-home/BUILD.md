# Rebuild `output/` from HUD source

The cluster image is **not** built from `src/` on apps-01.
`install-jarvis-home.sh` copies `Dockerfile` + `output/` only.

`src/lib/hud/` is the TanStack HUD (home, status, telemetry scrape, dossiers).
**Do not** use the Grok App Builder / preview tab. Product HUD for talking to
JARVIS is **jarvis.lan** glass (`~/jarvis-app/glass`, D-0029). This tree is
home.lan only and is deferred until that surface is retired.

To refresh `output/` later (bastion Node 22 + TanStack Start + Tailwind v4,
when that workshop exists here — not App Builder):

1. HUD files: `src/lib/hud`, `src/routes/{index,status,health}.tsx`,
   `src/routes/api/telemetry.ts`, `src/styles.css`, fonts under `public/fonts`.
2. `npm run build` → `.vercel/output/` (functions + static).
3. Replace `apps/jarvis-home/output/` with that directory.
4. Dockerfile stays `COPY output/` + srvx `--prod`.
5. Bump `IMAGE` in `VERSION` and both `homepage.yaml` files.
6. `./scripts/install-jarvis-home.sh` then Flux Recreate.

Live image still carries the committed `output/` (v0.4.9) until that cut.
Do not `npm run build` on the k3s nodes. Do not copy pin numbers into REBUILD.md.
