#!/bin/bash
# Layer 80 — memory/RAG meta. Counts and names only. No fact text, no JWT, no db dumps.
set -euo pipefail
if [ "$(whoami)" != agent ]; then echo FATAL: run as agent >&2; exit 1; fi

printf '\n========== 80-MEMORY ==========\n'
date -Is

echo
echo "--- learned.md files (mode/size, no body) ---"
ssh -n -o BatchMode=yes apps-01 '
if sudo test -f /cluster/local/openclaw/learned.md; then
  sudo stat -c "apps-01 mode=%a size=%s mtime=%y path=%n" /cluster/local/openclaw/learned.md
  echo -n "apps-01_fact_lines "
  sudo grep -c "^-" /cluster/local/openclaw/learned.md || true
else
  echo "apps-01 learned.md MISS"
fi
'
ssh -n -o BatchMode=yes data-01 '
if sudo test -f /cluster/nfs/jarvis/learned.md; then
  sudo stat -c "nfs mode=%a size=%s mtime=%y path=%n" /cluster/nfs/jarvis/learned.md
  echo -n "nfs_fact_lines "
  sudo grep -c "^-" /cluster/nfs/jarvis/learned.md || true
else
  echo "nfs learned.md MISS"
fi
'

echo
echo "--- product sqlite on NFS (mode/size, no rows) ---"
ssh -n -o BatchMode=yes data-01 '
for f in promoted.sqlite sessions.sqlite backup-status.json; do
  p="/cluster/nfs/jarvis/$f"
  if sudo test -f "$p"; then
    sudo stat -c "nfs mode=%a size=%s mtime=%y path=%n" "$p"
  else
    echo "MISS $p"
  fi
done
if sudo test -d /cluster/nfs/jarvis/files; then
  echo -n "files_dir "
  sudo stat -c "mode=%a path=%n" /cluster/nfs/jarvis/files
  echo -n "files_entries "
  sudo find /cluster/nfs/jarvis/files -mindepth 1 -maxdepth 1 | wc -l
else
  echo "files dir MISS"
fi
'

echo
echo "--- seed-learned crontab ---"
crontab -l 2>/dev/null | grep seed-learned || echo "crontab MISS"

echo
echo "--- Open WebUI sqlite: knowledge + filters (names) ---"
# stdin is the python (script file heredoc), not ssh -n
ssh -o BatchMode=yes apps-01 'sudo python3 -' << 'PY'
import sqlite3
c = sqlite3.connect("/cluster/local/open-webui/webui.db")
c.row_factory = sqlite3.Row
print("knowledge")
try:
    rows = c.execute("select name, description from knowledge").fetchall()
    for r in rows:
        print(" ", r["name"], "|", (r["description"] or "")[:80])
except Exception as e:
    print(" knowledge FAIL", type(e).__name__)
print("functions")
try:
    rows = c.execute("select id, name, type, is_active, is_global, length(content) from function").fetchall()
    for r in rows:
        print(" ", r["id"], r["name"], r["type"], "active="+str(r["is_active"]), "global="+str(r["is_global"]), "bytes="+str(r[5]))
except Exception as e:
    print(" functions FAIL", type(e).__name__)
print("model_overlays")
try:
    rows = c.execute("select id, name, is_active from model").fetchall()
    for r in rows:
        print(" ", r["id"], "name="+r["name"], "active="+str(r["is_active"]))
except Exception as e:
    print(" model FAIL", type(e).__name__)
PY

echo
echo "--- briefing in git (bytes only) ---"
if [ -f "$HOME/jarvis-infra/docs/briefing.md" ]; then
  wc -c "$HOME/jarvis-infra/docs/briefing.md"
else
  echo "briefing.md MISS"
fi

echo
echo "========== DONE 80-MEMORY =========="
echo "DISCOVER_OK layer=memory no fact text"
