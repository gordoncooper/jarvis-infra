# JARVIS Phase 13 — Homepage  UP 2026-09-08 20:22

http://home.lan  **200**

ConfigMap files as **subPath**; logs **emptyDir** (`mkdir /app/config/logs` 500 if the whole CM is mounted).
`HOMEPAGE_ALLOWED_HOSTS=*`. DNS home.lan → 192.168.8.11.
Image `ghcr.io/gethomepage/homepage:v1.1.1` on apps-01.
