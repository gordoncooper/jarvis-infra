# Rebuild JARVIS from scratch

Authoritative cluster YAML is **Gitea**. This repo is metal + bootstrap + **the command-center image**.
GitHub `gordoncooper/jarvis-cluster` is a **mirror** of Gitea.

Hardware: 6× ThinkCentre M920x i7-8700T, Ubuntu 26.04, user **`agent`** (never `bastion`).
gpu-01/gpu-02: RTX A1000. Other four: Patriot P300 512G as `/cluster`.

USB (not in Git): `~/.config/sops/age/keys.txt` and mkcert `rootCA-key.pem`.

Known-good snapshot: **v0.4.6** (command center live, home 200 / status 200).
GitHub already has v0.1 … v0.4.3 on `jarvis-cluster` — do not reuse those.

## Homepage contract (Home + Status)

Same image, two routes. Both must come back after a greenfield rebuild.

| Piece | Repo | Path |
|---|---|---|
| Dockerfile + SSR bundle (`output/`) | this repo | `apps/jarvis-home/` |
| Import into k3s on apps-01 | this repo | `scripts/install-jarvis-home.sh` |
| Deploy / Service / Ingress | Gitea / jarvis-cluster | `clusters/jarvis/apps/homepage.yaml` |
| DNS | router | `home.lan` → `192.168.8.11` |

Image: `docker.io/library/jarvis-home:v0.4.5` · `imagePullPolicy: Never` · node `apps-01`.
`output/` is **in git**. Do not install gethomepage.

**Order:** build+import the image **before** Flux applies the Deployment. If you get `ErrImageNeverPull`, run the install script, then `kubectl -n apps delete pod -l app=homepage`.

## 0. Router (click-ops)

Follow [bootstrap/router.md](../bootstrap/router.md). DHCP reservations + DNS
for nodes **and** `git.lan chat.lan jarvis.lan llm.lan grafana.lan home.lan`
→ `192.168.8.11`, **`agent.lan` → `192.168.8.16`**.

## 1. OS

Ubuntu 26.04 on all seven boxes. Create `agent` with passwordless sudo + SSH
from bastion. Clone this repo on the bastion **as agent**:

```bash
sudo su - agent
git clone git@github.com:gordoncooper/jarvis-infra.git ~/jarvis-infra
cd ~/jarvis-infra
git checkout v0.4.6    # or main if you want HEAD
# confirm the command-center bundle is present
test -d apps/jarvis-home/output
test -f apps/jarvis-home/Dockerfile
sudo apt update && sudo apt install -y ansible git python3-yaml bzip2
ansible-playbook playbooks/ping.yml
ansible-playbook playbooks/identify-disks.yml   # STOP if P300 map is wrong
ansible-playbook playbooks/site.yml             # GPU node reboots once
ansible-playbook playbooks/verify.yml
```

## 2. k3s + command-center image

```bash
./k3s/install-server.sh
./k3s/join-agents.sh
# kubectl get nodes — 6 Ready, etcd on ctrl-01 only
ansible-playbook playbooks/nvidia-runtime.yml --limit gpu-01,gpu-02
./scripts/install-jarvis-home.sh    # apps-01 containerd; do this BEFORE Flux
```

## 3. Gitea (chicken-egg)

```bash
ssh ctrl-01 'sudo mkdir -p /cluster/local/gitea && sudo chown -R 1000:1000 /cluster/local/gitea'
kubectl apply -f bootstrap/gitea.yaml
kubectl -n gitea rollout status deploy/gitea
# http://git.lan  — create user jarvis, repo jarvis/cluster (private)
```

Repair: restore `gitea.tgz` first ([RESTORE.md](RESTORE.md)), skip empty repo.

## 4. Load cluster YAML into Gitea

This YAML includes `clusters/jarvis/apps/homepage.yaml` (`jarvis-home:v0.4.5`).

```bash
git clone --mirror git@github.com:gordoncooper/jarvis-cluster.git /tmp/jarvis-cluster.git
git --git-dir=/tmp/jarvis-cluster.git push --mirror http://jarvis:${TOKEN}@git.lan/jarvis/cluster.git
```

## 5. Secrets then Flux (git.lan only)

```bash
# USB → ~/.config/sops/age/keys.txt  mode 600
sops --decrypt secrets/secrets.sops.yaml > /tmp/secrets.yaml
./bootstrap/apply-secrets.sh /tmp/secrets.yaml
shred -u /tmp/secrets.yaml
./bootstrap/flux-bootstrap.sh
```

If homepage is `ErrImageNeverPull` / 503: `./scripts/install-jarvis-home.sh` then delete the pod.

## 6. TLS

```bash
./scripts/lan-https.sh
./scripts/install-lan-ca.sh
# phones/laptops: import /mnt/nfs/share/certs/jarvis-rootCA.pem
```

git.lan stays **HTTP**. agent.lan:**18789** stays HTTP.

## 7. Models (GPU)

```bash
git clone http://jarvis:${TOKEN}@git.lan/jarvis/cluster.git ~/cluster
./scripts/create-jarvis-ollama.sh    # gpu-01 qwen + Git persona
./scripts/pull-embed-model.sh        # gpu-02 nomic
./scripts/seed-open-webui-model.sh   # sqlite jarvis-local params
```

Knowledge collection **lab-docs**: create empty in Open WebUI, re-upload notes
(files are NFS-backup only).

## 8. Bastion extras

```bash
./scripts/configure-goose.sh
sudo cp systemd/jarvis-backup.* /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now jarvis-backup.timer
./scripts/verify-jarvis.sh
# MUST see:
#   home_https   200
#   home_status  200
#   image docker.io/library/jarvis-home:v0.4.5
```

## 9. Optional data (old chats / Grafana sqlite)

See [RESTORE.md](RESTORE.md). Else greenfield UIs.
Re-pair OpenClaw at http://agent.lan:18789.

## Do not

- Point Flux at GitHub
- `cluster-init` on an existing sqlite datastore
- Put `agent.lan` on 192.168.8.11
- Commit mkcert keys or plaintext `secrets.yaml`
- `nvidia.com/gpu` on the exporter
- Run Goose against `jarvis-local` (invents hardware)
- Point homepage at `ghcr.io/gethomepage` (replaced by `jarvis-home:v0.4.5`)
- Let Flux schedule homepage before `install-jarvis-home.sh` (`ErrImageNeverPull`)
- Use `npx srvx` as the image CMD (Ready stays 0/1, home.lan 503)
- Run these scripts as user `bastion` (`~/jarvis-infra` is empty there)
