#!/bin/bash
# Layer 10 — bastion jump host. No secret values. Run as agent.
set -euo pipefail
if [ "$(whoami)" != agent ]; then echo FATAL: run as agent >&2; exit 1; fi
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CLUSTER="${JARVIS_CLUSTER:-$HOME/cluster}"
umask 077

printf '\n========== 10-BASTION ==========\n'
date -Is
echo "whoami=$(whoami) HOME=$HOME hostname=$(hostname)"
echo "login_shell=$SHELL"
echo "groups=$(id -nG)"

echo
echo "--- pins (VERSION file, not secret) ---"
if [ -f "$ROOT/VERSION" ]; then
  grep -E '^(GIT_TAG|IMAGE_TAG|IMAGE|K3S)=' "$ROOT/VERSION"
else
  echo "VERSION MISS $ROOT/VERSION"
fi

echo
echo "--- clones / remotes (tokens stripped) ---"
strip() { sed -E 's#://[^/@]+@#://#g'; }
APP="${JARVIS_APP:-$HOME/jarvis-app}"
for spec in "infra:$ROOT" "cluster:$CLUSTER" "app:$APP"; do
  label="${spec%%:*}"
  dir="${spec#*:}"
  echo -n "$label dir=$dir "
  if [ -d "$dir/.git" ]; then
    echo "git=yes"
    echo -n "  describe "; git -C "$dir" describe --tags --always 2>/dev/null || echo MISS
    git -C "$dir" status -sb | head -5 | sed 's/^/  /'
    git -C "$dir" remote -v 2>/dev/null | strip | awk '{print "  remote",$1,$2,$3}' | sort -u
  else
    echo "git=MISS"
  fi
done

echo
echo "--- tools (HAVE/MISS + version head) ---"
tool() {
  local n="$1"
  if command -v "$n" >/dev/null 2>&1; then
    echo -n "HAVE $n -> $(command -v "$n") "
    case "$n" in
      sops) sops --version 2>/dev/null | head -1 ;;
      age|age-keygen) "$n" --version 2>/dev/null | head -1 ;;
      kubectl) kubectl version --client --short 2>/dev/null | head -1 || kubectl version --client 2>/dev/null | head -1 ;;
      flux) flux version --client 2>/dev/null | head -1 ;;
      git) git --version ;;
      ansible-playbook) ansible-playbook --version 2>/dev/null | head -1 ;;
      docker) docker --version 2>/dev/null | head -1 ;;
      k3s) k3s --version 2>/dev/null | head -1 ;;
      *) "$n" --version 2>/dev/null | head -1 || echo ;;
    esac
  else
    echo "MISS $n"
  fi
}
for t in git ssh kubectl flux sops age age-keygen ansible-playbook docker k3s python3 jq tar gzip mkcert goose; do
  tool "$t"
done

echo
echo "--- kubeconfig META (no token, no client-key) ---"
KCFG="${KUBECONFIG:-$HOME/.kube/config}"
if [ -f "$KCFG" ]; then
  stat -c "EXISTS mode=%a size=%s mtime=%y path=%n" "$KCFG"
  echo -n "current-context "
  kubectl config current-context 2>/dev/null || echo MISS
  echo -n "server "
  kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}' 2>/dev/null; echo
else
  echo "MISS $KCFG"
fi
echo "rule: kubeconfig stays on bastion; never copy to a laptop"

echo
echo "--- age key META (no material) ---"
AGE="$HOME/.config/sops/age/keys.txt"
if [ -f "$AGE" ]; then
  stat -c "EXISTS mode=%a size=%s mtime=%y path=%n" "$AGE"
  echo -n "pub_comment_lines "
  grep -c '^# public key:' "$AGE" 2>/dev/null || echo 0
else
  echo "MISS $AGE"
fi

echo
echo "--- HOME files of interest (mode/size only) ---"
meta() {
  local p="$1"
  if [ -e "$p" ]; then
    if [ -d "$p" ]; then
      stat -c "DIR  mode=%a path=%n" "$p"
    else
      stat -c "FILE mode=%a size=%s mtime=%y path=%n" "$p"
    fi
  else
    echo "MISS $p"
  fi
}
meta "$HOME/.litellm-master.key"
meta "$HOME/.xai-api.key"
meta "$HOME/.grafana-admin"
meta "$HOME/.gitea-admin.pass"
meta "$HOME/.gitea-flux.token"
meta "$HOME/.openclaw-gateway.token"
meta "$HOME/.ssh/id_ed25519"
meta "$HOME/.ssh/id_ed25519.pub"
meta "$HOME/.ssh/id_ed25519_github"
meta "$HOME/.ssh/id_ed25519_github.pub"
meta "$HOME/.config/goose"
meta "$HOME/.config/goose/config.yaml"
meta "$HOME/.config/goose/secrets.yaml"
meta "$HOME/.config/goose/context.md"
meta "$ROOT/.sops.yaml"
meta "$ROOT/secrets/secrets.sops.yaml"

echo
echo "--- ssh dir (names/modes, no key bodies) ---"
if [ -d "$HOME/.ssh" ]; then
  ls -l "$HOME/.ssh" | awk '{print $1,$5,$6,$7,$8,$9}'
else
  echo "MISS $HOME/.ssh"
fi

echo
echo "--- systemd backup unit ---"
systemctl is-enabled jarvis-backup.timer 2>/dev/null | sed 's/^/timer_enabled /' || echo "timer_enabled MISS"
systemctl is-active jarvis-backup.timer 2>/dev/null | sed 's/^/timer_active /' || true
systemctl list-timers jarvis-backup.timer --no-pager 2>/dev/null | head -5
echo -n "installed_ExecStart "
systemctl cat jarvis-backup.service 2>/dev/null | awk -F= '/^ExecStart=/{print $2; exit}' || echo MISS
echo -n "git_ExecStart "
awk -F= '/^ExecStart=/{print $2; exit}' "$ROOT/systemd/jarvis-backup.service" 2>/dev/null || echo MISS

echo
echo "--- crontab (command lines only) ---"
crontab -l 2>/dev/null | grep -v '^#' | grep -v '^$' || echo "(empty)"

echo
echo "--- goose config keys (no values) ---"
if [ -f "$HOME/.config/goose/config.yaml" ]; then
  python3 - "$HOME/.config/goose/config.yaml" << 'PY'
import sys
from pathlib import Path
p = Path(sys.argv[1])
keys = []
for line in p.read_text().splitlines():
    if ":" in line and not line.lstrip().startswith("#"):
        k = line.split(":", 1)[0].strip()
        if k:
            keys.append(k)
print("goose_config_keys", ",".join(keys[:40]))
print("goose_config_bytes", p.stat().st_size)
PY
else
  echo "goose_config MISS"
fi

echo
echo "--- df (bastion) ---"
df -hT / /home 2>/dev/null | awk 'NR==1 || $NF=="/" || $NF=="/home"'

echo
echo "========== DONE 10-BASTION =========="
echo "DISCOVER_OK layer=bastion no secrets"
