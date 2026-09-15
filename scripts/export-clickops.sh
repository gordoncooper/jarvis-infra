#!/bin/bash
# Click-ops drift report. Not a backup — see backup-jarvis.sh and docs/RESTORE.md.
# Run on bastion as agent. Output stays on disk; never git it.
set -euo pipefail
if [ "$(whoami)" != agent ]; then echo FATAL: run as agent >&2; exit 1; fi

STAMP=$(date +%Y%m%d-%H%M)
OUT="${CLICKOPS_OUT:-$HOME/clickops-export-$STAMP}"
CLUSTER="${JARVIS_CLUSTER:-$HOME/cluster}"
GIT_DASH="$CLUSTER/clusters/jarvis/monitoring/dashboards"
PASS_FILE="$HOME/.grafana-admin"

mkdir -p "$OUT/grafana/dashboards" "$OUT/open-webui"
echo "OUT=$OUT"

if [ ! -f "$PASS_FILE" ]; then
  echo "FATAL: missing $PASS_FILE" >&2
  exit 1
fi
if [ ! -d "$GIT_DASH" ]; then
  echo "FATAL: missing $GIT_DASH (need ~/cluster)" >&2
  exit 1
fi

echo "== grafana vs git =="
export GRAFANA_USER=admin
GRAFANA_PASSWORD=$(tr -d '\n' < "$PASS_FILE")
export GRAFANA_PASSWORD
python3 - "$OUT" "$GIT_DASH" << 'PY'
import json, os, ssl, sys, urllib.request, base64
from pathlib import Path

out, git_dash = Path(sys.argv[1]), Path(sys.argv[2])
user, pw = os.environ["GRAFANA_USER"], os.environ["GRAFANA_PASSWORD"]
ctx = ssl._create_unverified_context()
auth = "Basic " + base64.b64encode(f"{user}:{pw}".encode()).decode()

def get(url):
    req = urllib.request.Request(url, headers={"Authorization": auth})
    with urllib.request.urlopen(req, context=ctx, timeout=30) as r:
        return json.load(r)

def var_sig(d):
    sig = []
    for v in (d.get("templating") or {}).get("list") or []:
        q = v.get("query") or ""
        if isinstance(q, dict):
            q = q.get("query") or json.dumps(q, sort_keys=True)
        sig.append((v.get("name"), v.get("refresh"), str(q)))
    return sig

items = get("https://grafana.lan/api/search?type=dash-db")
(out / "grafana/search.json").write_text(json.dumps(items, indent=2))
api = {}
for it in items:
    uid = it.get("uid")
    if not uid:
        continue
    try:
        body = get(f"https://grafana.lan/api/dashboards/uid/{uid}")
    except Exception as e:
        (out / "grafana/dashboards" / f"{uid}.err").write_text(str(e))
        continue
    dash = body.get("dashboard") or body
    fn = "".join(c if c.isalnum() or c in "-_" else "_" for c in (dash.get("title") or uid))[:80]
    (out / "grafana/dashboards" / f"{fn}.json").write_text(json.dumps(body, indent=2))
    api[uid] = dash

try:
    ds = get("https://grafana.lan/api/datasources")
    (out / "grafana/datasources.json").write_text(json.dumps(ds, indent=2))
except Exception as e:
    (out / "grafana/datasources.err").write_text(str(e))

git = {}
for p in sorted(git_dash.glob("*.json")):
    d = json.loads(p.read_text())
    uid = d.get("uid")
    if uid:
        git[uid] = (p.name, d)

report = []
fail = 0
for uid, (name, gd) in sorted(git.items()):
    ad = api.get(uid)
    if not ad:
        report.append(f"MISSING_LIVE  git={name} uid={uid}")
        fail += 1
        continue
    title_ok = (ad.get("title") or "") == (gd.get("title") or "")
    vars_ok = var_sig(ad) == var_sig(gd)
    if title_ok and vars_ok:
        report.append(f"MATCH         git={name} uid={uid} title={gd.get('title')}")
    else:
        fail += 1
        why = []
        if not title_ok:
            why.append(f"title live={ad.get('title')!r} git={gd.get('title')!r}")
        if not vars_ok:
            why.append(f"templating live={var_sig(ad)!r} git={var_sig(gd)!r}")
        report.append(f"DRIFT         git={name} uid={uid} " + "; ".join(why))

for uid, ad in sorted(api.items()):
    if uid not in git:
        report.append(f"EXTRA_LIVE    uid={uid} title={ad.get('title')}")
        fail += 1

(out / "grafana/drift.txt").write_text("\n".join(report) + "\n")
print("\n".join(report))
print(f"grafana_json {len(list((out / 'grafana/dashboards').glob('*.json')))} drift_lines {len(report)}")
sys.exit(2 if fail else 0)
PY
gstat=$?
unset GRAFANA_PASSWORD
export -n GRAFANA_PASSWORD || true

echo "== open-webui sqlite meta (names, no secrets) =="
# stdin IS the remote program — do not add ssh -n
ssh -o BatchMode=yes apps-01 "sudo python3 -" << 'PY' > "$OUT/open-webui/sqlite-meta.json"
import sqlite3, json, re
p = "/cluster/local/open-webui/webui.db"
c = sqlite3.connect("file:%s?mode=ro" % p, uri=True)
c.row_factory = sqlite3.Row
ok = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")
tables = [r[0] for r in c.execute("select name from sqlite_master where type='table' order by 1") if ok.match(r[0])]
out = {"tables": {t: c.execute("select count(*) from \"%s\"" % t).fetchone()[0] for t in tables}}
# collection / knowledge names only
for t in tables:
    cols = [x[1] for x in c.execute("pragma table_info(\"%s\")" % t)]
    low = t.lower()
    name_cols = [x for x in cols if x.lower() in ("name", "title", "filename", "collection_name")]
    if low in ("knowledge", "file", "document", "model", "prompt", "config") or "knowledge" in low:
        rows = []
        qcols = name_cols or [x for x in cols if x.lower() not in ("data", "content", "meta", "blob")][:6]
        if not qcols:
            continue
        sel = ", ".join(qcols)
        for r in c.execute("select %s from \"%s\" limit 200" % (sel, t)):
            d = dict(zip(qcols, r))
            for k in list(d):
                if any(s in k.lower() for s in ("password", "token", "secret", "api_key", "hash", "key")):
                    d[k] = "***"
            rows.append(d)
        out[t] = rows
print(json.dumps(out, default=str, indent=2))
PY

kubectl -n apps get deploy open-webui -o jsonpath='{range .spec.template.spec.containers[0].env[*]}{.name}={.value}{"\n"}{end}' \
  | grep -v -iE 'key=|token=|secret=' > "$OUT/open-webui/live.env" || true

python3 - "$OUT" << 'PY'
import json, sys
from pathlib import Path
out = Path(sys.argv[1])
meta = json.loads((out / "open-webui/sqlite-meta.json").read_text() or "{}")
print("webui tables", json.dumps(meta.get("tables") or {}, sort_keys=True))
for t, rows in meta.items():
    if t == "tables" or not isinstance(rows, list):
        continue
    names = []
    for r in rows:
        names.append(r.get("name") or r.get("title") or r.get("filename") or r.get("collection_name") or "?")
    print(f"webui {t}: {len(rows)} -> {names[:12]}")
PY

echo "== files =="
find "$OUT" -type f | sort
echo "OUT=$OUT"
if [ "$gstat" -eq 0 ]; then
  echo "CLICKOPS MATCH (grafana git vs live templating/title)"
  exit 0
elif [ "$gstat" -eq 2 ]; then
  echo "CLICKOPS DRIFT (see $OUT/grafana/drift.txt) — report only, cluster unchanged"
  exit 0
else
  echo "CLICKOPS grafana fetch failed rc=$gstat" >&2
  exit "$gstat"
fi
