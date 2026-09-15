#!/bin/bash
# First k3s server on ctrl-01. Do NOT pass cluster-init to a live sqlite DB.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck disable=SC1091
. "$ROOT/VERSION"
scp "$ROOT/k3s/server-config.yaml" ctrl-01:/tmp/k3s-config.yaml
ssh -n ctrl-01 "sudo mkdir -p /etc/rancher/k3s && sudo mv /tmp/k3s-config.yaml /etc/rancher/k3s/config.yaml && curl -sfL https://get.k3s.io | INSTALL_K3S_VERSION=${K3S} sh -s - server"
sleep 8
ssh -n ctrl-01 'sudo systemctl is-active k3s; sudo k3s kubectl get nodes'
mkdir -p ~/.kube
scp ctrl-01:/etc/rancher/k3s/k3s.yaml ~/.kube/config
sed -i 's/127.0.0.1/192.168.8.11/' ~/.kube/config
chmod 600 ~/.kube/config
kubectl get nodes
