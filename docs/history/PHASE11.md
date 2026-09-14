# JARVIS Phase 11 — Grafana + Prometheus  UP 2026-09-08

See [docs/LESSONS.md](docs/LESSONS.md).

## What is running

| Workload | Node |
|---|---|
| grafana, prometheus, kube-state-metrics | data-02 |
| node-exporter | all six |

- http://grafana.lan  user `admin`  password `~/.grafana-admin`
- Secret `monitoring/grafana` **before** the Grafana Deployment
- kube-state-metrics image **v2.20.0** (v2.14.2 404)
- Dashboard **1860** — filter on **Instance**, not Nodename
- Do not gzip+base64 manifests through chat

## Disk on data-02

```
/cluster/local/grafana      uid 472
/cluster/local/prometheus   uid 65534
```
