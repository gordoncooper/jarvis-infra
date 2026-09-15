# Rebuild JARVIS from scratch

Pins live in [`VERSION`](../VERSION). This file is the **procedure**.
If a number here disagrees with `VERSION`, **`VERSION` wins**.

`PHASE*.md`, old changelog entries, and `GITHUB-CUTOVER.md` are **history**.
Do not rewrite them to match the living pin. Do not retag old git tags.

```
. ~/jarvis-infra/VERSION
echo "checkout $GIT_TAG   image $IMAGE"
```

`GIT_TAG` and `IMAGE_TAG` are allowed to differ (docs cut vs image cut).

Authoritative cluster YAML is **Gitea** (`http://git.lan/jarvis/cluster.git`).
This repo is metal + bootstrap + the command-center **image**.
GitHub `gordoncooper/jarvis-cluster` is a **mirror**. Never point Flux at GitHub.

Hardware: 6x ThinkCentre M920x i7-8700T, Ubuntu 26.04, user **`agent`** (never `bastion`).
gpu-01 / gpu-02: RTX A1000. Other four: Patriot P300 512G as `/cluster`.

USB (not in Git): mkcert `rootCA-key.pem`. Age key when SOPS lands (not required yet).

## Homepage contract (Home + Status)

Same image, two routes. Both must come back after a greenfield rebuild.

| Piece | Repo | Path |
| --- | --- | --- |
| Pins | this repo | `VERSION` |
| Dockerfile + SSR bundle (`output/`) | this repo | `apps/jarvis-home/` |
| Import into k3s on apps-01 | this repo | `scripts/install-jarvis-home.sh` (reads `VERSION`) |
| Deploy / Service / Ingress / events RBAC | Gitea | `clusters/jarvis/apps/homepage.yaml` |
| Alignment | this repo | `scripts/check-contract.sh` |
| Live proof | this repo | `scripts/verify-jarvis.sh` |
| DNS | router | `home.lan` -> `192.168.8.11` |

`output/` is **in git**. Do not install gethomepage. Do not `npm run build` on the cluster.

Image: `IMAGE` from `VERSION` · `imagePullPolicy: Never` · node `apps-01` · SA `homepage`.

**Order:** import the image **before** Flux applies the Deployment. If you get
`ErrImageNeverPull`, run the install script, then
`kubectl -n apps delete pod -l app=homepage`.

## 0. Router (click-ops)

Follow [bootstrap/router.md](../bootstrap/router.md). DHCP reservations + DNS
for nodes **and** `git.lan chat.lan jarvis.lan llm.lan grafana.lan home.lan`
-> `192.168.8.11`, **`agent.lan` -> `192.168.8.16`**.

## 1. OS

Ubuntu 26.04 on all seven boxes. Create `agent` with passwordless sudo + SSH
from bastion. Clone this repo on the bastion **as agent**:

```bash
sudo su - agent
git clone git@github.com:gordoncooper/jarvis-infra.git ~/jarvis-infra
cd ~/jarvis-infra
. ./VERSION
git fetch --tags
git checkout "$GIT_TAG"

test -d apps/jarvis-home/output
test -f apps/jarvis-home/Dockerfile
test -f VERSION
sudo apt update && sudo apt install -y ansible git python3-yaml bzip2
ansible-playbook playbooks/ping.yml
ansible-playbook playbooks/identify-disks.yml
ansible-playbook playbooks/site.yml
ansible-playbook playbooks/verify.yml
```

## 2. k3s + command-center image

```bash
./k3s/install-server.sh
./k3s/join-agents.sh
ansible-playbook playbooks/nvidia-runtime.yml --limit gpu-01,gpu-02
./scripts/install-jarvis-home.sh
```

## 3. Gitea (chicken-egg)

```bash
ssh -n ctrl-01 'sudo mkdir -p /cluster/local/gitea && sudo chown -R 1000:1000 /cluster/local/gitea'
kubectl apply -f bootstrap/gitea.yaml
kubectl -n gitea rollout status deploy/gitea
```

Repair: restore `gitea.tgz` first ([RESTORE.md](RESTORE.md)), skip empty repo.

## 4. Load cluster YAML into Gitea

```bash
git clone --mirror git@github.com:gordoncooper/jarvis-cluster.git /tmp/jarvis-cluster.git
git --git-dir=/tmp/jarvis-cluster.git push --mirror http://jarvis:${TOKEN}@git.lan/jarvis/cluster.git
```

## 5. Secrets then Flux (git.lan only)

SOPS is **not** required yet. Until `secrets/secrets.sops.yaml` exists, secrets
are chmod 600 files on bastion (`~/.litellm-master.key`, `~/.xai-api.key`, ...)
and NFS `bastion-secrets.tgz`. See [secrets/README.md](../secrets/README.md).

```bash
./bootstrap/apply-secrets.sh
./bootstrap/flux-bootstrap.sh
```

If homepage is `ErrImageNeverPull` / 503: `./scripts/install-jarvis-home.sh`
then delete the pod.

## 6. TLS

```bash
./scripts/lan-https.sh
./scripts/install-lan-ca.sh
```

git.lan stays **HTTP**. agent.lan:**18789** stays HTTP.

## 7. Models (GPU)

```bash
git clone http://jarvis:${TOKEN}@git.lan/jarvis/cluster.git ~/cluster
./scripts/create-jarvis-ollama.sh
./scripts/pull-embed-model.sh
./scripts/seed-open-webui-model.sh
```

Knowledge collection **lab-docs**: create empty in Open WebUI, re-upload notes
(files are NFS-backup only).

## 8. Bastion extras

```bash
./scripts/configure-goose.sh
sudo cp systemd/jarvis-backup.* /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now jarvis-backup.timer
./scripts/check-contract.sh
./scripts/verify-jarvis.sh
```

## 9. Optional data

See [RESTORE.md](RESTORE.md). Re-pair OpenClaw at http://agent.lan:18789.

## Do not

- Point Flux at GitHub
- `cluster-init` on an existing sqlite datastore
- Put `agent.lan` on 192.168.8.11
- Commit mkcert keys or plaintext `secrets.yaml`
- `nvidia.com/gpu` on the exporter
- Run Goose against `jarvis-local` (invents hardware)
- Point homepage at `ghcr.io/gethomepage`
- Let Flux schedule homepage before `install-jarvis-home.sh`
- Use `npx srvx` as the image CMD
- Run these scripts as user `bastion`
- Copy image/git tags into this file — edit `VERSION` and both `homepage.yaml` files
- Retag any tag already on origin (never `git tag -f`)
- Treat `GIT_TAG` and `IMAGE_TAG` as the same number
