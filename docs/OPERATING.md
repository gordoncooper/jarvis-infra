# How we operate JARVIS

Short contract for humans and copilots. Surfaces/URLs: [INTERACT.md](INTERACT.md).
Procedure: [REBUILD.md](REBUILD.md). Footguns: [LESSONS.md](LESSONS.md).

## Authority (highest first)

1. **Live cluster** (`kubectl`, node SSH, NFS). If git and live disagree, live wins.
2. **Gitea** `http://git.lan/jarvis/cluster.git` — Flux origin. Never point Flux at GitHub.
3. **`VERSION`** in this repo — living `GIT_TAG`, `IMAGE` / `IMAGE_TAG`, `K3S`. Independent numbers.
4. This file + REBUILD (procedure, no pins).
5. LESSONS (rack landmines still true).
6. GitHub `gordoncooper/jarvis-infra` (origin for this repo) and `jarvis-cluster` (**mirror only**).
   No third repo. SOPS lives here (`secrets/secrets.sops.yaml`).

## Hard rules

- Run as user **agent** (`HOME=/home/agent`). Never `bastion`.
- Do not retag. Do not `git tag -f`. Next snapshot is a **new** `GIT_TAG`.
- Do not copy pin numbers into REBUILD / README. Edit `VERSION` and both `homepage.yaml` files.
- Do not bump the homepage **image** unless `https://home.lan/status` is wrong.
- Homepage: one image, `imagePullPolicy: Never`, `nodeSelector: jarvis.role=apps`, SA `homepage`. Import with `install-jarvis-home.sh` **before** Flux.
- `npx srvx` is forbidden as the image CMD. Dockerfile `COPY output/` + srvx `--prod`. `install-jarvis-home.sh` tars **only** `Dockerfile` + `output/`.
- Homepage SA lists events, Flux CRs, **pods**, **nodes** (dossiers). Click tiles on home.lan.
- `agent.lan` DNS is **192.168.8.16** (hostPort 18789, HTTP). `git.lan` stays HTTP.
- Ask for bastion `cat` / `ls` / `kubectl` before changing cluster YAML. Do not assume a laptop clone is canonical.
- Pastes: wrap in a quoted heredoc. `ssh -n` except when stdin **is** the remote program. No gzip+base64 YAML in chat.
- Architecture READMEs stay full mermaid **in git**. Chat may summarize.

## Proof

```bash
./scripts/check-contract.sh
./scripts/verify-jarvis.sh
```

## Node updates / smoke

Rolling apt + reboot (dry-run unless `CONFIRM=yes`): `./scripts/cluster-update-reboot.sh`.
After a real run: `./scripts/smoke-operator.sh` (nodes, HTTPS, GPU, one LiteLLM ping).
Flux/image contract is still `./scripts/verify-jarvis.sh`. There is no `docs/SMOKE-OPERATOR.md`.

Repo hygiene (not the product spec): [`BACKLOG.md`](BACKLOG.md).

## Secrets

Encrypted file: `secrets/secrets.sops.yaml`. Age private key is **not** in git:
bastion `~/.config/sops/age/keys.txt` (mode 600) + USB copy.

```bash
./scripts/materialize-bastion-secrets.sh
./bootstrap/apply-secrets.sh
```

chmod 600 bastion files + NFS `bastion-secrets.tgz` are the rack-reboot path.
SOPS + USB age key is the house-fire path.

HUD for chat.lan is ConfigMap inject (see INTERACT): collapsed sidebar, no suggestion chips, no follow-ups (sqlite). Model picker is stock type.

After Open WebUI restore: `./scripts/seed-webui-ui.sh` then `./scripts/seed-open-webui-model.sh`.

Persona / router: [`PLAN.md`](PLAN.md). Do not add exact-phrase keyword rules. HUD CSS is chrome, not routing. Copilot contract: [`COPILOT.md`](COPILOT.md).

Laptop wake (hey_jarvis) is not a cluster unit. See [INTERACT.md](INTERACT.md) (venv, Voice chat, local commands).
