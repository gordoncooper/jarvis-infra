# jarvis-home (command center)

Replaces gethomepage. Do not deploy ghcr.io/gethomepage.

- https://home.lan — Home (services + rack)
- https://home.lan/status — Status floor
- https://home.lan/api/telemetry — Prometheus JSON

Dockerfile + output/ live in jarvis-infra. Flux YAML lives in Gitea jarvis-cluster k8s/apps/homepage.yaml.
output/ is committed. Image docker.io/library/jarvis-home:v0.4.5, imagePullPolicy Never, apps-01 only.

- v0.1 — npx srvx never bound :3000
- v0.2 — git v0.4.4, tiles simulated
- v0.4.5 — Prometheus scrape, PROMETHEUS_URL=http://prometheus.monitoring.svc:9090

Header LIVE or SIM. Bastion has no node-exporter.
