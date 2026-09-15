#!/bin/bash
# Join workers after ctrl-01 k3s server is up. Run on bastion as agent.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck disable=SC1091
. "$ROOT/VERSION"
SERVER=https://192.168.8.11:6443
TOKEN=$(ssh -n ctrl-01 'sudo cat /var/lib/rancher/k3s/server/node-token')

join() {
  local host="$1" ip="$2"; shift 2
  echo "===== $host $ip $* ====="
  ssh -n "$host" "curl -sfL https://get.k3s.io | INSTALL_K3S_VERSION=${K3S} K3S_URL=${SERVER} K3S_TOKEN=${TOKEN} sh -s - agent --node-ip ${ip} $*"
}

join gpu-01  192.168.8.12 --node-label jarvis.role=gpu --node-label jarvis.gpu=chat
join gpu-02  192.168.8.13 --node-label jarvis.role=gpu --node-label jarvis.gpu=perception
join data-01 192.168.8.14 --node-label jarvis.role=storage --node-label jarvis.storage=primary
join data-02 192.168.8.15 --node-label jarvis.role=storage --node-label jarvis.storage=replica
join apps-01 192.168.8.16 --node-label jarvis.role=apps

# toolkit AFTER agents exist
cd "$(dirname "$0")/.."
ansible-playbook playbooks/nvidia-runtime.yml --limit gpu

kubectl get nodes -o wide
kubectl get nodes --show-labels | tr ',' '\n' | grep jarvis || true
