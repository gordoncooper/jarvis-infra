# jarvis-home (command center)

One image, two routes. Do not deploy gethomepage.

Current pin lives in [`../../VERSION`](../../VERSION).
install-jarvis-home.sh sources that.

| URL | Route |
| --- | --- |
| https://home.lan | Home |
| https://home.lan/status | Status |
| https://home.lan/api/telemetry | JSON + events |

output/ is committed. imagePullPolicy Never. SA homepage.

| Image | First git tag | Notes |
| --- | --- | --- |
| v0.1 | — | npx srvx never bound :3000 |
| v0.2 | v0.4.4 | srvx --prod |
| v0.4.5 | v0.4.5 | Prometheus scrape |
| v0.4.8 | v0.4.8 | event stream. current IMAGE_TAG |
