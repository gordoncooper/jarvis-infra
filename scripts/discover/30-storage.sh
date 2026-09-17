#!/bin/bash
# Layer 30 — NFS / hostPath / backup stamps. Listing only. No extract, no restore.
set -euo pipefail
if [ "$(whoami)" != agent ]; then echo FATAL: run as agent >&2; exit 1; fi
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

printf '\n========== 30-STORAGE ==========\n'
date -Is

echo
echo "--- ansible nfs vars (names) ---"
if [ -f "$ROOT/inventory/group_vars/all.yml" ]; then
  grep -E '^(nfs_|cluster_mount|cluster_disk)' "$ROOT/inventory/group_vars/all.yml" || true
fi

echo
echo "--- data-01 NFS export / backups (listing) ---"
ssh -n -o BatchMode=yes -o ConnectTimeout=8 data-01 'set +e
echo -n "hostname "; hostname
echo "--- exports ---"
if [ -f /etc/exports ]; then sudo cat /etc/exports; else echo "exports MISS"; fi
echo "--- /cluster ---"
ls -ld /cluster /cluster/nfs /cluster/nfs/backups /cluster/nfs/jarvis 2>/dev/null
echo "--- backups stamps (newest 12) ---"
if [ -d /cluster/nfs/backups ]; then
  sudo bash -lc "ls -1dt /cluster/nfs/backups/*/ 2>/dev/null | head -12"
  echo -n "backup_du "; sudo du -sh /cluster/nfs/backups 2>/dev/null
  NEWEST=$(sudo bash -lc "ls -1dt /cluster/nfs/backups/*/ 2>/dev/null | head -1")
  echo "NEWEST=$NEWEST"
  if [ -n "$NEWEST" ]; then sudo bash -lc "ls -lh $NEWEST"; fi
else
  echo "backups MISS"
fi
echo "--- nfs jarvis learned meta ---"
if [ -f /cluster/nfs/jarvis/learned.md ]; then
  sudo stat -c "FILE mode=%a size=%s mtime=%y path=%n" /cluster/nfs/jarvis/learned.md
else
  echo "learned.md MISS"
fi
echo "--- df /cluster ---"
df -hT /cluster 2>/dev/null | tail -1
'

echo
echo "--- node mounts (/cluster /mnt/nfs) ---"
for h in ctrl-01 gpu-01 gpu-02 data-01 data-02 apps-01; do
  echo "===== $h ====="
  ssh -n -o BatchMode=yes -o ConnectTimeout=8 "$h" 'set +e
findmnt -n -o SOURCE,TARGET,FSTYPE,OPTIONS /cluster 2>/dev/null | sed "s/^/cluster /" || echo "cluster unmounted"
findmnt -n -o SOURCE,TARGET,FSTYPE,OPTIONS /mnt/nfs 2>/dev/null | sed "s/^/nfs /" || echo "nfs unmounted"
df -hT /cluster /mnt/nfs 2>/dev/null | awk "NR>1 {print}"
'
done

echo
echo "--- hostPath dirs (names, apps-01 /cluster/local) ---"
ssh -n -o BatchMode=yes -o ConnectTimeout=8 apps-01 'set +e
ls -la /cluster/local 2>/dev/null | awk "NR==1 || \$1 ~ /^d/ {print}"
echo "--- learned hostPath ---"
sudo ls -ld /cluster/local/openclaw
sudo ls -1 /cluster/local/openclaw
if sudo test -f /cluster/local/openclaw/learned.md; then
  sudo stat -c "FILE mode=%a size=%s mtime=%y path=%n" /cluster/local/openclaw/learned.md
else
  echo "apps-01 learned.md MISS"
fi
'

echo
echo "--- data-02 grafana hostPath (names) ---"
ssh -n -o BatchMode=yes -o ConnectTimeout=8 data-02 'set +e
ls -ld /cluster/local /cluster/local/grafana 2>/dev/null
ls /cluster/local 2>/dev/null | head -20
'

echo
echo "--- etcd snapshots on ctrl-01 (names/sizes, no restore) ---"
ssh -n -o BatchMode=yes -o ConnectTimeout=8 ctrl-01 'set +e
if [ -d /mnt/nfs/snapshots ]; then
  sudo ls -lh /mnt/nfs/snapshots 2>/dev/null | tail -n +1 | awk "NR==1 || /on-demand/ || /etcd-snapshot/" | tail -25
  echo -n "on-demand_count "; sudo ls /mnt/nfs/snapshots/on-demand-* 2>/dev/null | wc -l
  echo -n "scheduled_count "; sudo ls /mnt/nfs/snapshots/etcd-snapshot-* 2>/dev/null | wc -l
  echo -n "snap_du "; sudo du -sh /mnt/nfs/snapshots 2>/dev/null
else
  echo "snapshots dir MISS"
fi
'

echo
echo "========== DONE 30-STORAGE =========="
echo "DISCOVER_OK layer=storage no extract"
