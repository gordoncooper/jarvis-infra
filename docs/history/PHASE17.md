# JARVIS Phase 17 — backup  UP 2026-09-08 20:54

Timer: 03:31 PDT. First dump `/cluster/nfs/backups/20260908-2053`
(~944M, mostly `apps-local.tgz` Whisper/HF cache). Keep 7 days.

`k3s etcd-snapshot save` **always** warns about server keys in
`config.yaml` (`cluster-init`, `tls-san`, …). Snapshot still writes.
Those keys are for `k3s server`, not the snapshot subcommand.

Driver 595: `nvidia-smi --query-gpu=persistence.mode` is invalid.
Use table `Persistence-M` or `nvidia-smi -pm 1` output.
