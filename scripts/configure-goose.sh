#!/bin/bash
# Install goose on the bastion and lay down both backend profiles.
# Idempotent: re-running never clobbers the profile you are currently on.
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/.." && pwd)
CFG=~/.config/goose

sudo apt-get install -y bzip2
command -v goose >/dev/null || \
  curl -fsSL https://github.com/block/goose/releases/download/stable/download_cli.sh | CONFIGURE=false bash
grep -q '.local/bin' ~/.bashrc || echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
export PATH="$HOME/.local/bin:$PATH"

mkdir -p "$CFG/profiles" ~/.local/bin
install -m 600 "$ROOT"/examples/goose/profiles/*.yaml "$CFG/profiles/"
install -m 755 "$ROOT/scripts/goose-backend" ~/.local/bin/goose-backend

umask 077
printf 'OPENAI_API_KEY: %s\n' "$(cat ~/.litellm-master.key)" > "$CFG/secrets.yaml"
chmod 600 "$CFG/secrets.yaml"

# Seed a default only on a fresh box. An existing config.yaml is the operator's
# current choice -- switch deliberately with goose-backend, not by re-running this.
if [ -f "$CFG/config.yaml" ]; then
  echo "keeping existing $CFG/config.yaml"
else
  goose-backend "${GOOSE_PROFILE:-llm-lan}"
fi

goose --version
goose-backend
