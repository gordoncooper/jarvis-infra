# MAP — open rows, then stop

This file is a router. Pick one row. Open at most the files in that row.
Do not inventory the repo. Live facts come from the cluster. Pins come from
`VERSION`. GitHub `jarvis-cluster` is a cache. Flux origin is Gitea `~/cluster`.

| Task | Repo | Open (max 3) | Skip |
| --- | --- | --- | --- |
| Law / why | infra | `AGENTS.md`, `docs/DECISIONS.md` index only | `docs/VISION.md`, `docs/persona.txt`, `docs/briefing.md` |
| Metal / Ansible / SOPS | infra | the matching playbook, `VERSION` | `apps/jarvis-home/output/**` |
| Product API / routing | app | `orchestrator/app/capabilities.py`, `docs/ARCHITECTURE.md` | `glass/themes/**` |
| Glass engine | app | `glass/src/core/**`, `docs/THEMES.md` | cockpit assets, reference jpgs |
| Cockpit UI | app | `glass/themes/cockpit/ui/**`, `glass/themes/cockpit/theme.json` | `glass/src/core` transport |
| Ship image | app | `VERSION`, `docs/WORKFLOW.md`, `scripts/install-images.sh` | Vite workshop |
| Flux / deploy pin | cluster (Gitea `~/cluster`) | `clusters/jarvis/apps/*.yaml` | `flux-system/gotk-components.yaml`, Grafana JSON |
| URLs / surfaces | app, or lab-map skill | one of: app `AGENTS.md` Surfaces table; lab-map skill | scraping Homepage or Traefik |
| Frozen brain | core | `AGENTS.md` only | `policy.yaml`, LAYOUT, HUD |

## Keep this current

Update this file in the same commit that changes where work lives:
repo split, ship path, Flux vs image pin, or a directory agents must stop opening.

Do not update this file for: a new decision, a lesson, a VERSION pin,
live cluster state, or an internal edit that does not change the Open/Skip columns.

If a row would need more than three Open paths, split the Task. Do not grow essays.

If you are unsure whether a change belongs here, leave MAP alone and ask.
