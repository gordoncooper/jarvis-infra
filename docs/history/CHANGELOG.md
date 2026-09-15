# JARVIS changelog

Living pins: [`VERSION`](../../VERSION). Entries below are **snapshots**.
Do not rewrite them when the pin moves.

## 2026-09-15  VERSION contract

Git **v0.4.12**. Image unchanged: **jarvis-home:v0.4.8**.
`VERSION` is the only living pin. `scripts/check-contract.sh` fails on drift.
v0.4.11 restored the full architecture READMEs. v0.4.10 was the first VERSION file.

## 2026-09-14  Phase 21 command center LIVE

home.lan **200**, /status **200**. Image `jarvis-home:v0.2` then Prometheus + events
through **v0.4.8**. srvx `--prod` (not npx). Run scripts as **agent**, never `bastion`.
