# Backlog

Engineering tickets. Product intent: [`VISION.md`](VISION.md) (do not append lists there).
Workshop: [`DEVOPS.md`](DEVOPS.md). Footguns: [`LESSONS.md`](LESSONS.md).
Do not copy pin numbers here. Check a box in git when it ships. One change per session.

Rank: **critical** (house dies or lying backups) · **high** (Tony-wrong or rebuild-broken) · **med** · **low**.
Not in this file: HUD CSS, mermaid pretty, voice timbre, suggestion chips.

---

## A. Product (spec in PLAN)

- [ ] **high** Product intent router (**D-0033**), `jarvis-app` orchestrator. Slices and the live baseline: `jarvis-app/docs/INTENT-ROUTER.md`. Local classifier only — no cloud model in the routing path
  - [x] 0 — live bugs: undefined `ALLOW_NS` (500 on `ns/name`), `remember that` storing the fact "that"
  - [x] 1 — utterance fixture + CI gate; `route()` extracted so the gate scores the real router. Chat false-positives 3 → **0**; capability passes **28**
  - [ ] 2 — capability manifest + honest refusal before the talker; `meta.capabilities`
  - [ ] 3 — `jarvis-local` classifier, `ROUTER_CLASSIFIER=off|shadow|on`
  - [ ] 4 — conversational referents ("remember that", "delete that last one"), confirm-gated
- [ ] **high** LiteLLM `classifier_type: llm` (grok-fast rubric) then **delete** famous-phrase `keyword_tier_rules`. **Next after D-0030 God’s Eye glass.** Done only when PLAN's five pings land. No new keyword PRs while waiting. **Not the same thing as D-0033** — this is the break-glass `chat.lan` router; D-0033 is the product path, which does not use the `jarvis` auto-router at all (D-0019)
- [ ] **med** Widen OpenClaw RBAC **only** after Gordon names verbs. Same Hands shim. Cat live Role first. No cluster-admin
- [ ] **med** Off-LAN: Tailscale (or equivalent). Not a bastion desktop. Not kubeconfig on a laptop. Becomes **high** the day he works off-LAN
- [ ] **low** gpu-02 stays embed-only until there is a reason for a second chat model (VRAM is free; context switch is not)

---

## B. HUD rebuild (home.lan — deferred)

home.lan image cut is **deferred** until that surface is retired into noc.lan
(D-0030). Product HUD is jarvis.lan glass (`JARVIS_THEME` packs).

Do as **one** image bump (`IMAGE` in VERSION + both `homepage.yaml`). Import on apps-01 **before** Flux. Never retag.

- [ ] **high** Bastion-native `output/` rebuild (`BUILD.md`) so the next cut does not require the Grok preview tab — **deferred**
- [x] **med** Strip `PreviewHostBridge`, `preview-host-bridge.ts`, `preview-embedder-origin.ts` (source; live image still v0.4.9 until rebuild)
- [ ] **low** Strip empty `AuthProvider` unless a real provider exists
- [x] **low** Drop `/__grok/*` from `src/routes/__root.tsx` (source). `output/static/__grok/` waits on image rebuild
- [ ] **med** Prove `/status` + dossiers; then bump `IMAGE` only (same session as the strip)

---

## C. Durability (house-fire / restore)

- [ ] **critical** Off-box copy of NFS backups (second disk, USB, or other house). Age key without the tarballs does not rebuild the house
- [ ] **high** Prove data-02 is a real replica (or write down that it is not). Backups today land on data-01 NFS
- [ ] **high** One restore rehearsal that unpacks a stamp into a **throwaway** dir (not `/cluster/local`, not `$HOME`) and diffs names/sizes vs live
- [ ] **med** Document etcd-snapshot restore as last-resort (ctrl-01: never `cluster-init`). Do not run it "to see"
- [ ] **med** Secret rotation runbook: Gitea / LiteLLM / Grafana / OpenClaw / xAI — SOPS edit + `materialize` + `apply-secrets`
- [ ] **med** mkcert / LAN CA expiry: when certs die, Traefik and browsers fail together. Calendar it. Becomes **critical** near expiry

---

## D. Platform drift

- [ ] **high** One `seed-all` wrapper (ui + model + lab-docs + learned + filters) so REBUILD cannot skip a step
- [ ] **med** Re-pin digests when we *intentionally* take a new Ollama / LiteLLM / OpenClaw / OWUI / monitoring image
- [ ] **med** apps-01 Docker legacy builder is deprecated. Next homepage image: buildx or `k3s ctr` only — pick one in BUILD.md
- [ ] **med** `ENABLE_SIGNUP=true` on chat.lan. Before Tailscale: off or pin users. **high** the day the glass is off-LAN
- [ ] **low** Flux `gotk-components` upgrade path. Discover live CRDs first
- [ ] **low** k3s client on bastion vs server pin in VERSION. Do not `curl | sh` without `INSTALL_K3S_VERSION`
- [ ] **low** sops binary vs upstream. Upgrade when we next touch secrets
- [ ] **low** Traefik is Helm-in-k3s, not Flux. Accept "pet" or import a HelmRelease. Do not half-manage it
- [ ] **low** Grafana JSON in git vs live (`export-clickops.sh`). Click-ops stays, or dashboards become Flux-only — pick once

---

## E. Doc debt (found in the 2026-09-19 audit)

- [ ] **med** Decide the six open questions in [`VISION.md`](VISION.md) — agent runtime, orchestrator, model roles, memory, voice, off-LAN. One decision entry each, not a passing mention in a session
- [ ] **low** `docs/openclaw-identity.md` references `USER.md`, which does not exist. Write it or drop the reference
- [ ] **low** `docs/persona.txt` and `docs/openclaw-soul.md` are byte-identical. Two copies will drift — make one the source and generate or symlink the other
- [ ] **low** `docs/LESSONS.md` dated sections mix history with instruction. Consider splitting timeless footguns from the handover narrative
- [ ] **low** `apps/jarvis-home/BUILD.md` still references the Grok App Builder tree, which the contract forbids as a workshop

---

## F. Contract / copilot gaps

- [ ] **med** Extend `check-contract.sh` for Hands, digest pins, MODEL_FILTER (fail on real drift, not comments)
- [ ] **med** `learned.md` mode 666 on a hostPath. Tighten ownership without breaking remember / OpenClaw
- [ ] **med** Dual `homepage.yaml` RBAC verbs in the contract (dossiers break when they drift)
- [ ] **low** seed-learned hourly cron vs `refresh-goose-context.sh`: one schedule, one log, fail loud
- [ ] **low** agent.lan stays HTTP (hostPort). TLS for that listener is a project, not a Traefik Host rule on :80

---

## G. Do not put back

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
