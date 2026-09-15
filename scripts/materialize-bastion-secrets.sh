#!/bin/bash
# Decrypt secrets.sops.yaml onto bastion chmod-600 files. Prints names only.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${1:-$ROOT/secrets/secrets.sops.yaml}"
command -v sops >/dev/null || { echo "need sops" >&2; exit 1; }
umask 077
tmp=$(mktemp)
trap 'shred -u "$tmp" 2>/dev/null || rm -f "$tmp"' EXIT
sops --decrypt "$SRC" > "$tmp"
python3 - "$tmp" << 'PY'
import sys
from pathlib import Path
home = Path.home()
try:
    import yaml
except ImportError:
    raise SystemExit("need python3-yaml")
d = yaml.safe_load(open(sys.argv[1])) or {}
mapping = {
    "xai_api_key": home / ".xai-api.key",
    "litellm_master_key": home / ".litellm-master.key",
    "grafana_admin_password": home / ".grafana-admin",
    "gitea_admin_password": home / ".gitea-admin.pass",
    "gitea_flux_token": home / ".gitea-flux.token",
    "openclaw_gateway_token": home / ".openclaw-gateway.token",
}
user = d.get("gitea_admin_user")
if user:
    p = home / ".gitea-admin.user"
    p.write_text(str(user).rstrip("\n") + "\n")
    p.chmod(0o600)
    print("wrote", p.name)
for k, p in mapping.items():
    v = d.get(k)
    if not v:
        print("skip", k)
        continue
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(str(v).rstrip("\n") + "\n")
    p.chmod(0o600)
    print("wrote", p.name)
PY
echo "materialize ok (no values printed)"
