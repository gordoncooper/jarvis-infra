# Rebuild JARVIS from scratch

Authoritative cluster YAML is **Gitea**. This repo is metal + bootstrap.
GitHub `gordoncooper/jarvis-cluster` is a **mirror** of Gitea.

Hardware: 6× ThinkCentre M920x i7-8700T, Ubuntu 26.04, user `agent`.
gpu-01/gpu-02: RTX A1000. Other four: Patriot P300 512G as `/cluster`.

## 0. Router (click-ops)

Follow [bootstrap/router.md](../bootstrap/router.md). DHCP reservations + DNS.

## 1. OS

Ubuntu 26.04 on all seven boxes. Create `agent` with passwordless sudo + SSH
from bastion. Clone this repo on the bastion:

```bash
git clone git@github.com:gordoncooper/jarvis-infra.git ~/jarvis-infra
cd ~/jarvis-infra
sudo apt update && sudo apt install -y ansible git python3-yaml
ansible-playbook playbooks/ping.yml
ansible-playbook playbooks/identify-disks.yml   # STOP if P300 map is wrong
ansible-playbook playbooks/site.yml             # GPU node reboots once
ansible-playbook playbooks/verify.yml
```

## 2. k3s

```bash
./k3s/install-server.sh
./k3s/join-agents.sh
# kubectl get nodes — 6 Ready, etcd on ctrl-01 only
```

## 3. Gitea (chicken-egg)

```bash
ssh ctrl-01 'sudo mkdir -p /cluster/local/gitea && sudo chown -R 1000:1000 /cluster/local/gitea'
kubectl apply -f bootstrap/gitea.yaml
kubectl -n gitea rollout status deploy/gitea
# http://git.lan  — create user jarvis, repo jarvis/cluster (private)
```

If this is a **repair** and you have NFS: restore `gitea.tgz` first
([docs/RESTORE.md](RESTORE.md)), skip empty repo creation.

## 4. Load cluster YAML into Gitea

Greenfield (GitHub mirror → Gitea):

```bash
git clone --mirror git@github.com:gordoncooper/jarvis-cluster.git /tmp/jarvis-cluster.git
git --git-dir=/tmp/jarvis-cluster.git push --mirror http://jarvis:${TOKEN}@git.lan/jarvis/cluster.git
```

Repair: already restored Gitea data; skip.

## 5. Flux against **git.lan** (never GitHub)

```bash
flux bootstrap git \
  --url=http://git.lan/jarvis/cluster.git \
  --branch=main \
  --path=clusters/jarvis \
  --username=jarvis \
  --password="${TOKEN}"
```

## 6. Secrets (SOPS)

See [secrets/README.md](../secrets/README.md). Then:

```bash
./bootstrap/apply-secrets.sh
```

## 7. TLS

```bash
./scripts/lan-https.sh
# install rootCA.pem once per OS (NFS: /mnt/nfs/share/certs/jarvis-rootCA.pem)
```

git.lan stays **HTTP**. agent.lan:**18789** stays HTTP.

## 8. Models (GPU)

```bash
./scripts/create-jarvis-ollama.sh    # gpu-01 qwen
./scripts/pull-embed-model.sh        # gpu-02 nomic
```

## 9. Bastion extras

```bash
sudo cp systemd/jarvis-backup.* /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now jarvis-backup.timer
# Goose: examples/goose/config.yaml  OPENAI_HOST=https://llm.lan
./scripts/verify-jarvis.sh
```

## 10. Optional data

Restore Open WebUI / Grafana / OpenClaw tarballs only if you want old
chats. Else greenfield. Re-pair OpenClaw Control UI.

## Do not

- Point Flux at GitHub
- `cluster-init` on an existing sqlite datastore
- Put `agent.lan` on 192.168.8.11
- Commit mkcert keys or `secrets.yaml`
- `nvidia.com/gpu` on the exporter
