# JARVIS Phase 20 — HTTPS  UP 2026-09-08 21:13

https://home.lan 200, https://grafana.lan 302, http://git.lan 200.
Cert SAN includes home.lan (re-issued `_wildcard.lan+15`).
git.lan HTTP for Flux. agent.lan:18789 HTTP (hostPort).
CA: ~/.local/share/mkcert/rootCA.pem  and  /mnt/nfs/share/certs/jarvis-rootCA.pem
*.lan wildcard is ignored by Chrome; explicit SANs matter.
