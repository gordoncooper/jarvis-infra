# Backlog

Tickets that are still worth doing. A shipped call lives in
[`DECISIONS.md`](DECISIONS.md). A footgun lives in [`LESSONS.md`](LESSONS.md).
Do not copy pin numbers here. Check a box in git when a ticket ships, then
delete the essay. One change per session.

Rank: **critical** (the house or the backups are lying) · **high** (a rebuild
would do the wrong thing) · **med** · **low**.

---

## Open

- [ ] **critical** Off-box copy of the NFS backups. Stamps exist only on data-01. The age key without those tarballs does not rebuild the house. Second disk, USB, or another machine in the house.
- [ ] **med** `learned.md` is mode `666` on NFS. It is operator-written break-glass knowledge, not product memory, and the mode means anyone can rewrite it. Tighten ownership without breaking `remember.sh` or the hourly `seed-learned.sh`.
- [ ] **med** Secret rotation is tribal. One short runbook for Gitea, LiteLLM, Grafana, OpenClaw, and xAI: edit SOPS, `materialize-bastion-secrets.sh`, `apply-secrets.sh`.
- [ ] **low** `check-contract.sh` only pins `jarvis-home`. The two `homepage.yaml` files can drift, and the orchestrator image tag is not checked at all.
- [ ] **low** Memory schema pin, and whether promoted sqlite gets an embed projection. Not before `learned.md` is a deliberate store with a real mode. See VISION item 4.

---

## Not tickets

Recorded so the next session does not reopen them.

- **home.lan HUD.** No new `jarvis-home` image. No App Builder workshop. No bastion rebuild of `output/` until that surface is actually retired. Product glass is `jarvis.lan`.
- **Off-LAN.** LAN-only until Gordon asks (D-0018). Not a bastion desktop. Not a kubeconfig on a laptop.
- **gpu-02.** Stays the embed node. Not a second chat model.
- **OpenClaw RBAC.** Do not widen it until Gordon names the verbs. Reads belong in the orchestrator first.
- **Traefik** stays the k3s chart. Do not half-import it into Flux.
- **Grafana** stays click-ops. `export-clickops.sh` is a snapshot, not a source Flux should own.
- **agent.lan** stays HTTP on the hostPort. TLS there is a project of its own, not a Traefik rule on port 80.
- **Upgrades with no pain.** k3s client skew of one minor, a newer sops binary, and a Flux components bump are not work until something breaks. Install scripts already pin `INSTALL_K3S_VERSION`.
- **LAN certs** expire December 2028. Not a ticket yet.
- **data-02 is not a backup replica.** It runs Prometheus and Grafana. Stamps live on data-01 only.
- **etcd restore** is [`RESTORE.md`](RESTORE.md) section 5. Last resort. Never `cluster-init` on a live server.
- **seed-learned** is the one hourly job, and it calls `refresh-goose-context.sh`. Do not add a second cron.

---

## Do not put back

- Exact-phrase keyword rules, or a live telemetry dump in the 7B prompt
- A HUD inject or a routed-model chip on chat.lan
- The Open WebUI filters D-0039 removed (telemetry, no-closer, remember)
- Nested Goose inside OpenClaw
- `docs/history/` phase novels
- App Builder, or a workshop bound to port 8080 on a node
- A kubeconfig on a laptop

---

## Done

Shipped calls are the decision log. This list is only so the essays above are not rewritten as new tickets.

- [x] Restore rehearsal. Stamp `20260922-0331` unpacked into a throwaway directory on data-01, diffed, and removed. 2026-09-22.
- [x] Intent router, D-0033 through D-0035
- [x] LiteLLM auto-router deleted, D-0040
- [x] `logs.tail` D-0041, `flux.status` and `backup.latest` D-0037, `files.list` D-0042
- [x] chat.lan signup off, D-0039
- [x] `AGENTS.md` / `LESSONS.md` split, D-0043
- [x] `openclaw-soul.md` is a symlink to `persona.txt`. The `USER.md` reference is gone
