# JARVIS — mistakes we will not repeat

If a future playbook contradicts this file, **this file wins**.

| Mistake | Do this instead |
| --- | --- |
| agent.lan on 192.168.8.11 | DNS and hosts -> 192.168.8.16, http://agent.lan:18789 |
| npx srvx as image CMD | node ./node_modules/srvx/bin/srvx.mjs --prod |
| Flux homepage before local image | install-jarvis-home.sh then Flux |
| imagePullPolicy Always | Never. Image is local on apps-01 |
| Same image tag + Never | Bump IMAGE_TAG in VERSION and both homepage.yaml files |
| Treat git tag and image tag as one number | VERSION has both. They may differ |
| Copy pins into REBUILD / README / PHASE | Edit VERSION + yaml only |
| Retag v0.4.4-v0.4.9 | Next tag is new |
| Run scripts as bastion | sudo su - agent |
| Paste set -euo pipefail + exit at the login prompt | wrap in bash << 'SCRIPT' so su - agent cannot logout |
| sops --decrypt before secrets.sops.yaml exists | bastion chmod 600 files |
| Follow GITHUB-CUTOVER.md as current | docs/REBUILD.md |
