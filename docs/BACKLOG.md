# Backlog

Engineering tickets. Product spec: [`PLAN.md`](PLAN.md) (do not append lists there).
Workshop: [`DEVOPS.md`](DEVOPS.md). Footguns: [`LESSONS.md`](LESSONS.md).
Do not copy pin numbers here. Check a box in git when it ships. One change per session.

Not in this file: HUD CSS, mermaid pretty, voice timbre, suggestion chips.

---

## A. Product (spec in PLAN)

These are real capability gaps. Implementation notes live in PLAN; the ticket is here.

- [ ] LiteLLM `classifier_type: llm` (grok-fast rubric) then **delete** famous-phrase `keyword_tier_rules`. Done only when PLAN's five pings land (hi/local, what-is-GPU/local, VRAM/hands, nodes-up/hands, Flux YAML/grok-code). No new keyword PRs while waiting
- [ ] Widen OpenClaw RBAC **only** after Gordon names verbs. Same Hands shim. Cat live Role first. No cluster-admin. No new panel
- [ ] Off-LAN: Tailscale (or equivalent). Not a bastion desktop. Not code-server. Not kubeconfig on a laptop
- [ ] gpu-02 stays embed-only until we have a reason to put a second **chat** model there (VRAM is free; context switch is not)

---

## B. HUD rebuild (next image cut)

`home.lan` still carries App Builder DNA. Do this as **one** image bump (`IMAGE` in VERSION + both `homepage.yaml`). Import on apps-01 **before** Flux. Never retag.

- [ ] Strip `PreviewHostBridge`, `preview-host-bridge.ts`, `preview-embedder-origin.ts`
- [ ] Strip empty `AuthProvider` unless a real provider exists
- [ ] Drop `/__grok/*` from `src/routes/__root.tsx` and `output/static/__grok/`
- [ ] Bastion-native `output/` rebuild (`BUILD.md`) so the next cut does not require the Grok preview tab
- [ ] Prove `/status` + dossiers; then bump `IMAGE` only

---

## C. Durability (house-fire / restore)

Dry-run of hostPath tarballs is done. The nuclear paths are not.

- [ ] One **read-only** restore rehearsal that actually unpacks a stamp into a throwaway dir (not `/cluster/local`, not `$HOME`) and diffs names/sizes vs live
- [ ] Document etcd-snapshot restore as a separate, last-resort drill (ctrl-01 sqlite datastore: never `cluster-init`). Do not run it "to see"
- [ ] Prove data-02 is a real replica (or write down that it is not). Backups today are NFS on data-01
- [ ] Off-box copy of NFS backups (second disk, USB, or other house). Age private key is necessary but not sufficient if `/cluster` burns with the rack
- [ ] Secret rotation runbook: Gitea token, LiteLLM master, Grafana, OpenClaw gateway, xAI — SOPS edit + `materialize` + `apply-secrets`. Do not invent a second secret store
- [ ] mkcert / LAN CA expiry: when `lan-https.sh` certs die, Traefik and browsers fail together. Calendar that

---

## D. Platform drift (will go stale)

Pins and vendors rot even if we do nothing.

- [ ] Flux `gotk-components` upgrade path (separate from app YAML). Discover live CRDs first
- [ ] Re-pin **digests** when we *intentionally* take a new Ollama / LiteLLM / OpenClaw / OWUI / monitoring image. Floating tags are already forbidden on those deploys
- [ ] k3s: client on bastion vs server pin in VERSION. Do not `curl | sh` without `INSTALL_K3S_VERSION`
- [ ] apps-01 Docker **legacy builder** is deprecated. Next homepage image: buildx or `k3s ctr` only — pick one in BUILD.md
- [ ] sops binary on bastion vs current upstream. Upgrade when we next touch secrets, not as a drive-by
- [ ] Traefik is Helm-in-k3s, not Flux. Either accept "pet" or import the HelmRelease. Do not half-manage it
- [ ] Grafana JSON in git vs live: `export-clickops.sh` is the drift report. Decide: click-ops stays, or dashboards become Flux-only
- [ ] Open WebUI sqlite is a cache. One `seed-all` wrapper (ui + model + lab-docs + learned + filters) so REBUILD cannot skip a step
- [ ] `ENABLE_SIGNUP=true` on chat.lan is lab-only. Before Tailscale: turn signup off or pin allowed users

---

## E. Contract / copilot gaps

- [ ] `check-contract.sh` does not know Hands, digest pins, MODEL_FILTER, or dual homepage YAML beyond the image line. Extend **carefully** (fail on real drift, not on comments)
- [ ] `learned.md` is mode 666 on a hostPath. Tighten ownership without breaking the remember filter or OpenClaw
- [ ] seed-learned hourly cron vs `refresh-goose-context.sh`: one schedule, one log, fail loud
- [ ] agent.lan stays HTTP (OpenClaw hostPort). TLS for that listener is a project, not a Traefik Host rule on :80
- [ ] Dual `homepage.yaml` (infra copy vs Gitea) will drift. Contract already diffs the image; add RBAC verbs if dossiers break again

---

## F. Do not put back

- Exact-phrase `keyword_tier_rules` / intent-gated LIVE dumps into the 7B
- MutationObserver HUD inject on chat.lan
- Nested Goose inside OpenClaw
- chat.lan routed-model chip (OWUI rewrites the stream)
- `docs/history/` PHASE novels
- App Builder / Vite / port 8080 preview as the workshop
- kubeconfig on a laptop

---

## Done (do not re-open)

- [x] Delete unused `apps/jarvis-home/INSTALL.txt`
- [x] `smoke-operator.sh` points at verify + INTERACT (no `SMOKE-OPERATOR.md`)
- [x] OPERATING documents `cluster-update-reboot.sh` + smoke vs verify
- [x] Repair `~~bash` fences in OPERATING / REBUILD / RESTORE
- [x] Day-0 workshop `DEVOPS.md` (shop floor)
