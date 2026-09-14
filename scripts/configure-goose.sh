#!/bin/bash
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/.." && pwd)
sudo apt-get install -y bzip2
command -v goose >/dev/null || \
  curl -fsSL https://github.com/block/goose/releases/download/stable/download_cli.sh | CONFIGURE=false bash
grep -q '.local/bin' ~/.bashrc || echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
export PATH="$HOME/.local/bin:$PATH"
mkdir -p ~/.config/goose
cp "$ROOT/examples/goose/config.yaml" ~/.config/goose/config.yaml
umask 077
printf 'OPENAI_API_KEY: %s\n' "$(cat ~/.litellm-master.key)" > ~/.config/goose/secrets.yaml
chmod 600 ~/.config/goose/config.yaml ~/.config/goose/secrets.yaml
goose --version
grep -E 'GOOSE_|OPENAI_HOST' ~/.config/goose/config.yaml
