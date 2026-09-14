#!/bin/bash
# Run on bastion as agent. Read-only dump of live JARVIS for GitHub cutover.
# Redacts secrets. Writes ~/jarvis-export-$STAMP.tar.gz
set -euo pipefail
STAMP=$(date +%Y%m%d-%H%M)
OUT="$HOME/jarvis-export-$STAMP"
mkdir -p "$OUT"/{ansible,k3s,hosts,systemd,tls,cluster-git,k8s-live,clickops,redacted}

redact() { sed -E 's/(api[_-]?key|token|password|secret|Bearer)[[:space:]]*[:=][[:space:]]*[^[:space:]]+/\1: ***REDACTED***/Ig'; }

echo "== hosts / os =="
{ hostname; date -Is; } | tee "$OUT/bastion.txt"
for h in ctrl-01 gpu-01 gpu-02 data-01 data-02 apps-01; do
  echo "----- $h -----" | tee -a "$OUT/hosts/summary.txt"
  ssh "$h" 'printf "hostname=%s\nkernel=%s\nip=%s\n" "$(hostname)" "$(uname -r)" "$(hostname -I)"
    echo "--- /etc/hosts ---"; grep -E "lan|192\.168\.8" /etc/hosts || true
    echo "--- fstab nfs ---"; grep -E "nfs|/cluster|/mnt/nfs" /etc/fstab || true
    echo "--- mounts ---"; findmnt -t nfs,nfs4,ext4,xfs 2>/dev/null | grep -E "/cluster|/mnt/nfs|^TARGET" || true
    echo "--- ufw ---"; sudo ufw status numbered 2>/dev/null || true
    echo "--- timedate ---"; timedatectl | grep -E "Synchronize|NTP|Time zone" || true
    echo "--- labels files ---"
    ls /etc/rancher/k3s 2>/dev/null || true
    ls /etc/rancher/node 2>/dev/null || true
  ' | tee "$OUT/hosts/$h.txt"
done

echo "== k3s =="
ssh ctrl-01 'sudo sed -E "s/(token:).*/\1 ***REDACTED***/I" /etc/rancher/k3s/config.yaml' > "$OUT/k3s/server-config.yaml" || true
ssh ctrl-01 'sudo ls -la /etc/rancher/k3s; echo ---; sudo ls /var/lib/rancher/k3s/server/db 2>/dev/null | head' > "$OUT/k3s/server-ls.txt" || true
kubectl get nodes -o wide > "$OUT/k8s-live/nodes.txt"
kubectl get nodes --show-labels | sed 's/beta.kubernetes.io[^,]*[,]//g' > "$OUT/k8s-live/node-labels.txt"
kubectl get pods -A -o wide > "$OUT/k8s-live/pods.txt"
kubectl get ingress -A -o yaml | redact > "$OUT/k8s-live/ingress.yaml"
kubectl get ns > "$OUT/k8s-live/ns.txt"
for n in kube-system flux-system gitea inference apps agents monitoring; do
  kubectl -n "$n" get deploy,ds,sts,svc,cm,ing,sa 2>/dev/null > "$OUT/k8s-live/$n-workloads.txt" || true
done
kubectl -n kube-system get deploy traefik -o yaml 2>/dev/null | redact > "$OUT/k8s-live/traefik.yaml" || true
kubectl -n kube-system get tlsstore -o yaml > "$OUT/k8s-live/tlsstore.yaml" || true
# runtime / nvidia
ssh gpu-01 'grep -n nvidia /var/lib/rancher/k3s/agent/etc/containerd/config.toml 2>/dev/null | head -40
  command -v nvidia-container-runtime; nvidia-smi -L
  systemctl is-enabled nvidia-persistenced 2>/dev/null || true
  nvidia-smi | sed -n "1,15p"' > "$OUT/k3s/gpu-01-runtime.txt" || true
ssh gpu-02 'command -v nvidia-container-runtime; nvidia-smi -L; nvidia-smi | sed -n "1,15p"' > "$OUT/k3s/gpu-02-runtime.txt" || true

echo "== live flux git clone (no secrets expected) =="
if [ -d "$HOME/cluster/.git" ]; then
  git -C "$HOME/cluster" remote -v > "$OUT/cluster-git/remotes.txt"
  git -C "$HOME/cluster" log --oneline -30 > "$OUT/cluster-git/log.txt"
  git -C "$HOME/cluster" status -sb > "$OUT/cluster-git/status.txt"
  git -C "$HOME/cluster" ls-files > "$OUT/cluster-git/ls-files.txt"
  mkdir -p "$OUT/cluster-git/tree"
  git -C "$HOME/cluster" archive HEAD | tar -C "$OUT/cluster-git/tree" -xf -
else
  echo "NO ~/cluster clone" | tee "$OUT/cluster-git/MISSING.txt"
fi

echo "== live ConfigMaps (redacted) =="
for pair in \
  "inference litellm-config" \
  "apps homepage" \
  "agents openclaw-config" \
  "agents openclaw-skill-cluster-metrics" \
  "agents openclaw-skill-cluster-health" \
  "monitoring prometheus" \
  "monitoring grafana-datasources"
 do
  set -- $pair
  kubectl -n "$1" get cm "$2" -o yaml 2>/dev/null | redact > "$OUT/k8s-live/cm-$1-$2.yaml" || echo "missing $1/$2" > "$OUT/k8s-live/cm-$1-$2.missing"
done
kubectl -n agents get deploy openclaw -o yaml | redact > "$OUT/k8s-live/deploy-openclaw.yaml"
kubectl -n apps get deploy open-webui,homepage,piper -o yaml 2>/dev/null | redact > "$OUT/k8s-live/deploy-apps.yaml"
kubectl -n inference get deploy ollama,ollama-embed,litellm -o yaml | redact > "$OUT/k8s-live/deploy-inference.yaml"
kubectl -n monitoring get deploy,ds -o yaml | redact > "$OUT/k8s-live/deploy-monitoring.yaml"
kubectl -n gitea get deploy -o yaml | redact > "$OUT/k8s-live/deploy-gitea.yaml"

echo "== click-ops exports =="
# Grafana dashboards via API if admin pass exists
if [ -f "$HOME/.grafana-admin" ]; then
  GPW=$(cat "$HOME/.grafana-admin")
  curl -sS -u "admin:${GPW}" http://grafana.lan/api/search \
    > "$OUT/clickops/grafana-search.json" || true
  python3 - << 'PY' || true
import json, os, urllib.request, base64
from pathlib import Path
out = Path.home() / os.environ.get("OUT_OVERRIDE", "")
PY
  mkdir -p "$OUT/clickops/grafana-dashboards"
  python3 - "$OUT" "$GPW" << 'PY'
import json, sys, urllib.request, ssl
out, pw = sys.argv[1], sys.argv[2]
import os
ctx = ssl.create_default_context()
# LAN grafana may be mkcert
try:
    import ssl as s
    ctx = s._create_unverified_context()
except Exception:
    pass
def get(url):
    req = urllib.request.Request(url)
    token = urllib.request.base64.b64encode(("admin:"+pw).encode()).decode()
    req.add_header("Authorization", "Basic "+token)
    with urllib.request.urlopen(req, context=ctx, timeout=15) as r:
        return json.load(r)
try:
    items = get("http://grafana.lan/api/search?type=dash-db")
except Exception as e:
    Path(out,"clickops/grafana-error.txt").write_text(str(e))
    items = []
Path(out,"clickops/grafana-search.json").write_text(json.dumps(items, indent=2))
for it in items:
    uid = it.get("uid")
    if not uid:
        continue
    try:
        dash = get(f"http://grafana.lan/api/dashboards/uid/{uid}")
    except Exception as e:
        continue
    fn = "".join(c if c.isalnum() or c in "-_" else "_" for c in (it.get("title") or uid))
    Path(out,"clickops/grafana-dashboards", fn+".json").write_text(json.dumps(dash, indent=2))
print("grafana dashboards", len(items))
PY
fi

# Open WebUI: copy env + note sqlite (do not dump chats)
kubectl -n apps get deploy open-webui -o jsonpath='{range .spec.template.spec.containers[0].env[*]}{.name}={.value}{"\n"}{end}' \
  | redact > "$OUT/clickops/open-webui.env"
ssh apps-01 'sudo ls -lh /cluster/local/open-webui | head; sudo python3 - <<"PY" 2>/dev/null || true
import sqlite3, os
p="/cluster/local/open-webui/webui.db"
if not os.path.exists(p):
    raise SystemExit("no webui.db")
c=sqlite3.connect("file:%s?mode=ro"%p, uri=True)
print("tables:")
for (t,) in c.execute("select name from sqlite_master where type=\"table\" order by 1"):
    n=c.execute("select count(*) from %s"%t).fetchone()[0]
    print(f"  {t} {n}")
PY' > "$OUT/clickops/open-webui-sqlite-meta.txt" || true

echo "== systemd / goose / mkcert (public only) =="
systemctl cat jarvis-backup.timer jarvis-backup.service 2>/dev/null > "$OUT/systemd/jarvis-backup.units" || true
systemctl list-timers jarvis-backup.timer --no-pager > "$OUT/systemd/timer.txt" || true
cp -a "$HOME/jarvis-cluster" "$OUT/ansible/jarvis-cluster-bastion" 2>/dev/null || echo "no ~/jarvis-cluster" > "$OUT/ansible/MISSING.txt"
# goose without keys
if [ -f "$HOME/.config/goose/config.yaml" ]; then
  redact < "$HOME/.config/goose/config.yaml" > "$OUT/clickops/goose-config.yaml"
fi
# mkcert public CA only
if [ -f "$HOME/.local/share/mkcert/rootCA.pem" ]; then
  cp "$HOME/.local/share/mkcert/rootCA.pem" "$OUT/tls/jarvis-rootCA.pem"
  openssl x509 -in "$OUT/tls/jarvis-rootCA.pem" -noout -subject -dates > "$OUT/tls/ca-info.txt"
fi
ls -l "$HOME/jarvis-tls" 2>/dev/null | grep -v key > "$OUT/tls/jarvis-tls-ls.txt" || true
echo | openssl s_client -connect 192.168.8.11:443 -servername home.lan 2>/dev/null \
  | openssl x509 -noout -ext subjectAltName > "$OUT/tls/live-san.txt" || true

echo "== nfs backups inventory =="
ssh data-01 'sudo du -sh /cluster/nfs/backups /cluster/nfs/snapshots /cluster/nfs/models 2>/dev/null
  sudo ls -lh /cluster/nfs/backups
  sudo ls -lh /cluster/nfs/snapshots | tail' > "$OUT/k3s/nfs-backups.txt" || true

echo "== pack =="
# strip accidental keys
find "$OUT" -iname '*key*.pem' -delete
find "$OUT" -iname '*.key' -delete
tar -C "$HOME" -czf "$HOME/jarvis-export-$STAMP.tar.gz" "$(basename "$OUT")"
ls -lh "$HOME/jarvis-export-$STAMP.tar.gz"
echo "OUT=$OUT"
echo "TARBALL=$HOME/jarvis-export-$STAMP.tar.gz"
echo "OK"
