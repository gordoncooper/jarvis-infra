# Goose on the bastion

Chat (Open WebUI) uses **jarvis-local** ($0). Goose the agent uses
**jarvis-grok-code** (xAI API $). The 7B invents shell output (fake EPYC);
do not use `jarvis-local` for Goose.

```bash
sudo apt install -y bzip2   # Goose tarball is .bz2
curl -fsSL https://github.com/block/goose/releases/download/stable/download_cli.sh \
  | CONFIGURE=false bash
export PATH="$HOME/.local/bin:$PATH"

mkdir -p ~/.config/goose
cp examples/goose/config.yaml ~/.config/goose/config.yaml
printf 'OPENAI_API_KEY: %s\n' "$(cat ~/.litellm-master.key)" \
  > ~/.config/goose/secrets.yaml
chmod 600 ~/.config/goose/secrets.yaml
export OPENAI_API_KEY="$(cat ~/.litellm-master.key)"
export GOOSE_MODEL=jarvis-grok-code

cd ~/cluster
goose session   # banner MUST say openai jarvis-grok-code
```

Trust output only when you see `▸ shell` and it matches `kubectl`/`ssh` you'd run yourself.
Goose's cwd is the **bastion** (Celeron N5105). Cluster nodes: `ssh gpu-01` / `kubectl`.
Never unattended `kubectl apply` / `delete`.
