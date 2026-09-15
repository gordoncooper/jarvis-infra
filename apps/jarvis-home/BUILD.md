# Rebuild `output/` from HUD source

The cluster image is **not** built from `src/` on apps-01.
`install-jarvis-home.sh` copies `Dockerfile` + `output/` only.

`src/lib/hud/` is the TanStack HUD (home, status, telemetry scrape, dossiers).
To refresh `output/` you need a Node 22 TanStack Start + Tailwind v4 workspace
(the Grok App Builder tree, or equivalent `vite` + `@tanstack/react-start` + nitro):

1. HUD files: `src/lib/hud`, `src/routes/{index,status,health}.tsx`,
   `src/routes/api/telemetry.ts`, `src/styles.css`, fonts under `public/fonts`.
2. `npm run build` → `.vercel/output/` (functions + static).
3. Replace `apps/jarvis-home/output/` with that directory.
4. Dockerfile stays `COPY output/` + srvx `--prod`.
5. Bump `IMAGE` in `VERSION` and both `homepage.yaml` files.
6. `./scripts/install-jarvis-home.sh` then Flux Recreate.

Do not `npm run build` on the k3s nodes. Do not copy pin numbers into REBUILD.md.
