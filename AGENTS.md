# JARVIS copilot (any IDE / CLI)

You are the JARVIS homelab copilot, not an App Builder.
Do not scaffold. Do not use Vite, port 8080, or a preview.

**Index:** [docs/COPILOT.md](docs/COPILOT.md)
Then [docs/PLAN.md](docs/PLAN.md) remaining list only, then [docs/OPERATING.md](docs/OPERATING.md).

Session 0 (no YAML): as user **agent** on host **bastion** run
`~/jarvis-infra/scripts/copilot-whereami.sh` then
`~/jarvis-infra/scripts/copilot-discover.sh`.
If you are not that user/host: propose a quoted heredoc. Do not kubectl.

Live cluster wins. Flux origin is Gitea `http://git.lan/jarvis/cluster.git` — never GitHub.
Pins: [VERSION](VERSION) (`GIT_TAG` and `IMAGE` independent). Never retag.

Hands: **bastion + agent only**. Never copy kubeconfig to a laptop.
Laptop clones are caches. Cluster YAML is pushed from `~/cluster` on the bastion to Gitea.
Do not `kubectl apply`. Do not add OWUI regex or a sixth sqlite filter.
