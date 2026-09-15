# How we operate JARVIS

Short contract for humans and copilots. Surfaces/URLs: [INTERACT.md](INTERACT.md).
Procedure: [REBUILD.md](REBUILD.md). Footguns: [LESSONS.md](LESSONS.md).

## Authority (highest first)

1. **Live cluster** (`kubectl`, node SSH, NFS). If git and live disagree, live wins.
2. **Gitea** `http://git.lan/jarvis/cluster.git` — Flux origin. Never point Flux at GitHub.
3. **`VERSION`** in this repo — living `GIT_TAG`, `IMAGE` / `IMAGE_TAG`, `K3S`. Independent numbers.
4. This file + REBUILD (procedure, no pins).
5. LESSONS (rack landmines still true).
6. `docs/history/` and `PHASE*` — frozen snapshots. Do not rewrite when VERSION moves.
7. GitHub `gordoncooper/jarvis-infra` (origin for this repo) and `jarvis-cluster` (**mirror only**).

## Hard rules

- Run as user **agent** (`HOME=/home/agent`). Never `bastion`.
- Do not retag. Do not `git tag -f`. Next snapshot is a **new** `GIT_TAG`.
- Do not copy pin numbers into REBUILD / README / PHASE. Edit `VERSION` and both `homepage.yaml` files.
- Do not bump the homepage **image** unless `https://home.lan/status` is wrong.
- Homepage: one image, `imagePullPolicy: Never`, `nodeSelector: jarvis.role=apps`, SA `homepage`. Import with `install-jarvis-home.sh` **before** Flux.
- `npx srvx` is forbidden as the image CMD.
- `agent.lan` DNS is **192.168.8.16** (hostPort 18789, HTTP). `git.lan` stays HTTP.
- Ask for bastion `cat` / `ls` / `kubectl` before changing cluster YAML. Do not assume a laptop clone is canonical.
- Pastes: wrap in a quoted heredoc. Always `ssh -n`. No gzip+base64 YAML in chat.
- Architecture READMEs stay full mermaid **in git**. Chat may summarize.

## Proof

~~bash
./scripts/check-contract.sh
./scripts/verify-jarvis.sh
~~

## Secrets

Encrypted file: `secrets/secrets.sops.yaml`. Age private key is **not** in git:
bastion `~/.config/sops/age/keys.txt` (mode 600) + USB copy.

~~bash
./scripts/materialize-bastion-secrets.sh
./bootstrap/apply-secrets.sh
~~

chmod 600 bastion files + NFS `bastion-secrets.tgz` are the rack-reboot path.
SOPS + USB age key is the house-fire path.
