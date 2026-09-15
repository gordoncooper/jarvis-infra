#!/bin/bash
# Bounded live snapshot for a new copilot. No secret values. No Helm blobs.
set -euo pipefail
if [ "$(whoami)" != agent ]; then echo FATAL: run as agent >&2; exit 1; fi
INFRA="${JARVIS_INFRA:-$HOME/jarvis-infra}"
CLUSTER="${JARVIS_CLUSTER:-$HOME/cluster}"
. "$INFRA/VERSION"

banner() { printf '\n========== %s ==========\n' "$1"; }

banner 'WHO'
date -Is
whoami
echo "HOME=$HOME"
hostname

banner 'PINS (VERSION file, not secret)'
grep -E '^(GIT_TAG|IMAGE_TAG|IMAGE|K3S)=' "$INFRA/VERSION"

banner 'GIT (describe + dirty only)'
echo -n "infra  "; git -C "$INFRA" describe --tags --always
git -C "$INFRA" status -sb | head -20
echo -n "cluster "; git -C "$CLUSTER" describe --tags --always
git -C "$CLUSTER" status -sb | head -20
echo -n "flux want "; git -C "$CLUSTER" rev-parse --short HEAD

banner 'NODES'
kubectl get nodes -o custom-columns='NAME:.metadata.name,VER:.status.nodeInfo.kubeletVersion,IP:.status.addresses[?(@.type=="InternalIP")].address,OS:.status.nodeInfo.osImage' --no-headers

banner 'PODS (non-Succeeded, names only)'
kubectl get pods -A --field-selector=status.phase!=Succeeded --no-headers \
  | awk '{printf "%-14s %-48s %-10s %s\n",$1,$2,$4,$5}'

banner 'FLUX'
flux -n flux-system get sources git 2>/dev/null | head -5
flux -n flux-system get kustomizations 2>/dev/null | head -5

banner 'HOMEPAGE CONTRACT'
kubectl -n apps get deploy homepage -o jsonpath='image={.spec.template.spec.containers[0].image} policy={.spec.template.spec.containers[0].imagePullPolicy} sa={.spec.template.spec.serviceAccountName}{"\n"}' 2>/dev/null || echo 'NO homepage deploy'

banner 'INGRESS HOSTS'
kubectl get ingress -A -o jsonpath='{range .items[*]}{.spec.rules[*].host}{"\n"}{end}' | sort -u

banner 'LEARNED (meta only, no body)'
ssh -n -o BatchMode=yes apps-01 'sudo stat -c "apps-01 %a %s bytes %n" /cluster/local/openclaw/learned.md' 2>/dev/null || echo 'no apps-01 learned.md'
ssh -n -o BatchMode=yes data-01 'sudo stat -c "nfs    %a %s bytes %n" /cluster/nfs/jarvis/learned.md' 2>/dev/null || echo 'no nfs learned.md'
ssh -n -o BatchMode=yes apps-01 'sudo wc -l /cluster/local/openclaw/learned.md' 2>/dev/null || true

banner 'CRON / BACKUP UNIT'
crontab -l 2>/dev/null | grep -v '^#' | grep -v '^$' || echo '(no crontab)'
systemctl cat jarvis-backup.service 2>/dev/null | grep -E '^ExecStart=' || echo 'no unit (agent may lack systemd user view)'
# installed unit path vs git
python3 - << 'P'
from pathlib import Path
p = Path("/etc/systemd/system/jarvis-backup.service")
g = Path.home() / "jarvis-infra/systemd/jarvis-backup.service"
def exe(path):
    if not path.exists():
        return None
    for ln in path.read_text().splitlines():
        if ln.startswith("ExecStart="):
            return ln
    return "?"
print("installed", exe(p) or "unreadable")
print("git      ", exe(g) or "missing")
P

banner 'TOOLS'
for b in sops age kubectl flux git; do
  command -v "$b" >/dev/null && echo "HAVE $b $(command -v $b)" || echo "MISS $b"
done
# age key meta only
k="$HOME/.config/sops/age/keys.txt"
if [ -f "$k" ]; then
  stat -c "age keys.txt mode=%a size=%s (no material)" "$k"
else
  echo "age keys.txt ABSENT"
fi

banner 'DONE'
echo "DISCOVER_OK  no writes  no secret values"
