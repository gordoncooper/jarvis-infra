# Backlog

Tracked work that is **not** the product north star. Product: [`PLAN.md`](PLAN.md).
Day 0 workshop: [`DEVOPS.md`](DEVOPS.md). Do not copy pin numbers here.

Check a box in git when it is done. One change per PR/session.

## Next HUD image (do not bump `IMAGE` until home.lan/status is wrong *or* this ships)

App Builder leftovers still in `apps/jarvis-home`. Strip on the **next** image cut, then `install-jarvis-home.sh` **before** Flux. New `IMAGE_TAG` only. Never retag.

- [ ] Remove `PreviewHostBridge` / `preview-host-bridge.ts` / `preview-embedder-origin.ts` from `src/`
- [ ] Remove empty `AuthProvider` passthrough (`src/lib/auth/provider.tsx`) unless a real provider exists
- [ ] Drop `/__grok/manifest.webmanifest` and `/__grok/icon-180.png` from `src/routes/__root.tsx`
- [ ] Drop `apps/jarvis-home/output/static/__grok/` from the committed bundle and rebuild `output/`
- [ ] Prove `https://home.lan/status` and dossiers still work; then bump `IMAGE` in `VERSION` + both `homepage.yaml`

## Docs / repo (later, not blocking)

- [ ] Do not merge `open-webui-audio.md` / `open-webui-knowledge.md` into INTERACT unless an engineer actually gets lost
- [ ] Keep `verify-jarvis.sh` and `smoke-operator.sh` as two scripts (contract vs operator ping). Do not invent a third
- [ ] Off-LAN workshop access is Tailscale (parked in PLAN). Not a bastion desktop. Not code-server

## Done (so we do not re-open)

- [x] Delete unused `apps/jarvis-home/INSTALL.txt`
- [x] `smoke-operator.sh` no longer points at missing `docs/SMOKE-OPERATOR.md`
- [x] OPERATING documents `cluster-update-reboot.sh` + smoke vs verify
- [x] Repair `~~bash` fences in OPERATING / REBUILD / RESTORE so GitHub renders code blocks
