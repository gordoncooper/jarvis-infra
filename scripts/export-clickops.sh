#!/bin/bash
set -euo pipefail
OUT="$HOME/clickops-export"
rm -rf "$OUT"
mkdir -p "$OUT/grafana/dashboards" "$OUT/open-webui"
echo "== grafana =="
GPW=$(cat "$HOME/.grafana-admin")
curl -sk -u "admin:${GPW}" "https://grafana.lan/api/search?type=dash-db" -o "$OUT/grafana/search.json"
python3 - "$OUT" "$GPW" << 'PY'
import json, sys, ssl, urllib.request, base64
from pathlib import Path
out, pw = Path(sys.argv[1]), sys.argv[2]
ctx = ssl._create_unverified_context()
def get(url):
    req = urllib.request.Request(url)
    req.add_header("Authorization", "Basic "+base64.b64encode(f"admin:{pw}".encode()).decode())
    with urllib.request.urlopen(req, context=ctx, timeout=20) as r:
        return json.load(r)
items = json.loads((out/"grafana/search.json").read_text() or "[]")
dashdir = out/"grafana/dashboards"
for it in items:
    uid = it.get("uid")
    if not uid:
        continue
    try:
        body = get(f"https://grafana.lan/api/dashboards/uid/{uid}")
    except Exception as e:
        (dashdir/f"{uid}.err").write_text(str(e)); continue
    title = it.get("title") or uid
    fn = "".join(c if c.isalnum() or c in "-_" else "_" for c in title)[:80]
    (dashdir/f"{fn}.json").write_text(json.dumps(body, indent=2))
print("grafana dashboards", len(list(dashdir.glob("*.json"))))
try:
    ds = get("https://grafana.lan/api/datasources")
    (out/"grafana/datasources.json").write_text(json.dumps(ds, indent=2))
except Exception as e:
    (out/"grafana/datasources.err").write_text(str(e))
PY
echo "== open-webui =="
ssh apps-01 "sudo python3 -" << 'PY' > "$OUT/open-webui/sqlite-meta.json"
import sqlite3, json, os
p="/cluster/local/open-webui/webui.db"
c=sqlite3.connect("file:%s?mode=ro"%p, uri=True)
c.row_factory=sqlite3.Row
tables=[r[0] for r in c.execute("select name from sqlite_master where type='table' order by 1")]
out={"tables":{t: c.execute("select count(*) from %s"%t).fetchone()[0] for t in tables}}
for t in tables:
    low=t.lower()
    if low in ("config","model") or "prompt" in low or "knowledge" in low:
        cols=[x[1] for x in c.execute("pragma table_info(%s)"%t)]
        rows=[]
        for r in c.execute("select * from %s"%t):
            d=dict(zip(cols,r))
            for k in list(d):
                if any(s in k.lower() for s in ("password","token","secret","api_key","hash")):
                    d[k]="***"
            rows.append(d)
        out[t]=rows
print(json.dumps(out, default=str, indent=2)[:500000])
PY
kubectl -n apps get deploy open-webui -o jsonpath='{range .spec.template.spec.containers[0].env[*]}{.name}={.value}{"\n"}{end}' \
  | grep -v -iE 'key=|token=|secret=' > "$OUT/open-webui/live.env" || true
echo "OUT=$OUT"
find "$OUT" -type f | sort
