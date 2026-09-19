#!/bin/bash
# Generate a LAN CA + wildcard cert (mkcert) and load it into Traefik.
# Run on bastion as agent. Does NOT put private keys in git.
set -euo pipefail

HOSTS=(
  "*.lan" chat.lan jarvis.lan noc.lan git.lan llm.lan grafana.lan home.lan agent.lan
  ctrl-01.lan gpu-01.lan gpu-02.lan data-01.lan data-02.lan apps-01.lan
  localhost 127.0.0.1
)

if ! command -v mkcert >/dev/null; then
  echo "installing mkcert"
  sudo apt-get install -y libnss3-tools
  ver=$(curl -fsSL https://api.github.com/repos/FiloSottile/mkcert/releases/latest | python3 -c 'import sys,json; print(json.load(sys.stdin)["tag_name"])')
  curl -fsSL -o /tmp/mkcert "https://github.com/FiloSottile/mkcert/releases/download/${ver}/mkcert-${ver}-linux-amd64"
  sudo install -m 755 /tmp/mkcert /usr/local/bin/mkcert
fi

export CAROOT="${CAROOT:-$HOME/.local/share/mkcert}"
mkdir -p "$CAROOT" ~/jarvis-tls
mkcert -install
cd ~/jarvis-tls
mkcert "${HOSTS[@]}"
# mkcert names the files from the first SAN
CERT=$(ls -1 *.pem | grep -v key | grep -v root | head -1)
KEY=$(ls -1 *-key.pem | head -1)
test -f "$CERT" && test -f "$KEY"

# NFS copy of the CA for phones/laptops (public cert only)
ssh data-01 "sudo mkdir -p /cluster/nfs/share/certs && sudo chmod 755 /cluster/nfs/share/certs"
scp "$CAROOT/rootCA.pem" agent@data-01:/tmp/jarvis-rootCA.pem
ssh data-01 'sudo mv /tmp/jarvis-rootCA.pem /cluster/nfs/share/certs/jarvis-rootCA.pem && sudo chmod 644 /cluster/nfs/share/certs/jarvis-rootCA.pem'

for ns in kube-system apps gitea inference monitoring agents; do
  kubectl create namespace "$ns" --dry-run=client -o yaml | kubectl apply -f -
  kubectl -n "$ns" create secret tls lan-tls \
    --cert="$CERT" --key="$KEY" \
    --dry-run=client -o yaml | kubectl apply -f -
  echo "secret $ns/lan-tls ok"
done

echo
echo "CA file: $CAROOT/rootCA.pem"
echo "Also:    /cluster/nfs/share/certs/jarvis-rootCA.pem  (from any node: /mnt/nfs/share/certs/)"
echo "Install that CA on each device, then use https://chat.lan"
