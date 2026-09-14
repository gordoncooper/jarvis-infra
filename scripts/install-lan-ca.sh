#!/bin/bash
set -euo pipefail
CA="${1:-/mnt/nfs/share/certs/jarvis-rootCA.pem}"
[ -f "$CA" ] || CA="$HOME/.local/share/mkcert/rootCA.pem"
test -f "$CA"
sudo cp "$CA" /usr/local/share/ca-certificates/jarvis-lan.crt
sudo update-ca-certificates
echo "installed $CA"
