# How we operate JARVIS

Short contract for humans and copilots. Surfaces/URLs: [INTERACT.md](INTERACT.md).
Procedure: [REBUILD.md](REBUILD.md). Footguns: [LESSONS.md](LESSONS.md).

## Authority (highest first)

Canonical version of this list is [`../AGENTS.md`](../AGENTS.md); it is repeated here
only so an operator reading the runbook is not surprised.

1. **Live cluster** (`kubectl`, node SSH, NFS). If git and live disagree, live wins.
2. **[`DECISIONS.md`](DECISIONS.md)** — dated calls, outranks all prose below.
3. **Gitea** `http://git.lan/jarvis/cluster.git` — Flux origin. Never point Flux at GitHub.
4. **`VERSION`** in this repo — living `GIT_TAG`, `IMAGE` / `IMAGE_TAG`, `K3S`. Independent numbers.
5. This file + REBUILD (procedure, no pins).
6. LESSONS (rack landmines still true).
7. GitHub `gordoncooper/jarvis-infra` (origin for this repo) and `jarvis-cluster` (**mirror only**).

Three repos: `jarvis-infra` (here), `cluster` (Flux YAML, Gitea origin), and
`jarvis-core` (prior art, read-only — D-0003). SOPS lives here
(`secrets/secrets.sops.yaml`).

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
- Pastes **to an operator who must run them** go in a quoted heredoc. On the bastion as
  `agent` with a shell, run the command yourself instead — see the MODE table in AGENTS.md.
  `ssh -n` except when stdin **is** the remote program. No gzip+base64 YAML in chat.
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

Persona / router: [`VISION.md`](VISION.md). Do not add exact-phrase keyword rules. HUD CSS is chrome, not routing. Agent contract: [`../AGENTS.md`](../AGENTS.md).

Laptop wake (hey_jarvis) is not a cluster unit. See [INTERACT.md](INTERACT.md) (venv, Voice chat, local commands).
