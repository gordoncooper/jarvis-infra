#!/bin/bash
# Layer 0 — metal. Greenfield-safe (k3s optional). Inventory-driven.
# No secrets. Run as agent on bastion. ssh -n with a quoted remote.
set -euo pipefail
if [ "$(whoami)" != agent ]; then echo FATAL: run as agent >&2; exit 1; fi
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
INV="$ROOT/inventory/hosts.yml"
VARS="$ROOT/inventory/group_vars/all.yml"

printf '\n========== 00-RACK ==========\n'
date -Is
echo "whoami=$(whoami) hostname=$(hostname) HOME=$HOME"

HOSTFILE=$(mktemp)
trap 'rm -f "$HOSTFILE"' EXIT

python3 - "$INV" "$VARS" "$HOSTFILE" << 'PY'
import re, sys
from pathlib import Path
inv, varsf, outp = sys.argv[1], sys.argv[2], sys.argv[3]
rows = []
bastion_ip = "192.168.8.10"
vp = Path(varsf)
if vp.is_file():
    m = re.search(r"ip:\s*(192\.168\.\d+\.\d+),\s*names:\s*\".*\bbastion\b", vp.read_text())
    if m:
        bastion_ip = m.group(1)
rows.append(("bastion", bastion_ip, "jump", "not-a-node"))
ipath = Path(inv)
if not ipath.is_file():
    print("INVENTORY_MISS", inv, file=sys.stderr)
else:
    cur = None
    fields = {}
    def flush():
        global cur, fields
        if cur and cur != "cluster":
            ip = fields.get("ansible_host", "")
            if ip:
                extra = []
                if fields.get("jarvis_gpu"):
                    extra.append("gpu=" + fields["jarvis_gpu"])
                if fields.get("jarvis_storage"):
                    extra.append("storage=" + fields["jarvis_storage"])
                rows.append((cur, ip, fields.get("jarvis_role") or "?", ",".join(extra)))
        cur, fields = None, {}
    for line in ipath.read_text().splitlines():
        m = re.match(r"^        ([A-Za-z0-9-]+):\s*$", line)
        if m:
            flush()
            cur = m.group(1)
            fields = {}
            continue
        m = re.match(r"^          ([A-Za-z0-9_]+):\s*(\S+)\s*$", line)
        if m and cur:
            fields[m.group(1)] = m.group(2)
    flush()
seen = set()
n = 0
with open(outp, "w") as f:
    for name, ip, role, extra in rows:
        if name in seen:
            continue
        seen.add(name)
        n += 1
        f.write("%s\t%s\t%s\t%s\n" % (name, ip, role, extra))
print("inventory_hosts", n)
PY

echo "--- intended ---"
if command -v column >/dev/null 2>&1; then
  column -t -s $'\t' "$HOSTFILE"
else
  cat "$HOSTFILE"
fi

# Remote probe: runs locally via bash -lc or over ssh -n. No stdin.
PROBE='set +e
. /etc/os-release 2>/dev/null
echo "os=${PRETTY_NAME:-unknown}"
echo "kernel=$(uname -r) arch=$(uname -m)"
echo "cpu=$(nproc)t"
awk -F: "/model name/{gsub(/^ /,\"\",\$2); print \"cpu_model=\" \$2; exit}" /proc/cpuinfo
awk "/MemTotal/{printf \"mem_mib=%d\n\", \$2/1024}" /proc/meminfo
echo -n "disks "
lsblk -dn -o NAME,SIZE,MODEL 2>/dev/null | paste -sd ";" -
echo
echo -n "nics "
ip -br a 2>/dev/null | awk "\$1 != \"lo\" {printf \"%s=%s \", \$1, \$3}"
echo
echo -n "mounts "
df -hT / /cluster /mnt/nfs 2>/dev/null | awk "NR>1 {printf \"%s:%s:%s:%s \", \$7, \$2, \$3, \$6}"
echo
if command -v nvidia-smi >/dev/null 2>&1; then
  echo -n "gpu "
  nvidia-smi -L 2>/dev/null | tr "\n" ";"
  echo
  nvidia-smi --query-gpu=name,memory.total,memory.used --format=csv,noheader 2>/dev/null | sed "s/^/gpu_mem /"
else
  echo "gpu MISS"
fi
echo -n "k3s_unit "
systemctl is-enabled k3s 2>/dev/null | tr "\n" " "
systemctl is-enabled k3s-agent 2>/dev/null || echo none
if command -v k3s >/dev/null 2>&1; then
  k3s --version 2>/dev/null | head -1 | sed "s/^/k3s_bin /"
else
  echo "k3s_bin MISS"
fi
if [ -d /cluster ]; then echo cluster_dir=yes; else echo cluster_dir=no; fi
'

run_probe() {
  local how="$1" target="$2"
  if [ "$how" = local ]; then
    bash -lc "$PROBE"
  else
    ssh -n -o BatchMode=yes -o ConnectTimeout=8 "$target" "bash -lc $(printf '%q' "$PROBE")"
  fi
}

while IFS=$'\t' read -r name ip role extra; do
  [ -n "$name" ] || continue
  echo
  echo "===== $name $ip role=$role $extra ====="
  if ping -c 1 -W 2 "$ip" >/dev/null 2>&1; then
    echo "ping=ok"
  else
    echo "ping=FAIL"
  fi
  if [ "$name" = "$(hostname)" ] || [ "$name" = bastion ]; then
    echo "path=local"
    run_probe local _
    continue
  fi
  if ssh -n -o BatchMode=yes -o ConnectTimeout=8 "$name" true >/dev/null 2>&1; then
    echo "ssh=ok"
    run_probe ssh "$name"
  elif ssh -n -o BatchMode=yes -o ConnectTimeout=8 "agent@$ip" true >/dev/null 2>&1; then
    echo "ssh=ok via-ip"
    run_probe ssh "agent@$ip"
  else
    echo "ssh=FAIL"
  fi
done < "$HOSTFILE"

echo
echo "========== DONE 00-RACK =========="
echo "DISCOVER_OK layer=rack no secrets"
