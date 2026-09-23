#!/bin/bash
# App probe — homepage / home.lan. No kubeconfig dump.
set -euo pipefail
if [ "$(whoami)" != agent ]; then echo FATAL: run as agent >&2; exit 1; fi
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
. "$ROOT/VERSION"

printf '\n========== APP homepage ==========\n'
date -Is
echo "pin IMAGE=$IMAGE"

echo
echo "--- deploy ---"
kubectl -n apps get deploy homepage -o json | IMAGE="$IMAGE" python3 -c '
import json,sys,os
d=json.load(sys.stdin)
spec=d["spec"]["template"]["spec"]
c=spec["containers"][0]
want=os.environ.get("IMAGE","")
print("image", c.get("image"))
print("policy", c.get("imagePullPolicy"))
print("sa", spec.get("serviceAccountName"))
print("nodesel", spec.get("nodeSelector"))
print("pin", want)
print("PIN_MATCH", c.get("image")==want)
print("POLICY_OK", c.get("imagePullPolicy")=="Never")
'
kubectl -n apps get pod -l app=homepage -o wide --no-headers

echo
echo "--- http (code + ctype, small JSON keys only) ---"
python3 - << 'PY'
import json, ssl, urllib.request
ctx = ssl._create_unverified_context()
urls = [
    "https://home.lan/",
    "https://home.lan/status",
    "https://home.lan/api/status",
    "https://home.lan/health",
]
for url in urls:
    try:
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req, timeout=10, context=ctx) as r:
            body = r.read(12000)
            ctype = r.headers.get("content-type", "")
            print(r.status, url, ctype, "bytes", len(body))
            if "json" in ctype.lower():
                d = json.loads(body.decode("utf-8", "replace"))
                if isinstance(d, dict):
                    print("  keys", sorted(d.keys())[:24])
                    for k in ("status", "app", "nodes", "gpus", "pod_count"):
                        if k in d:
                            v = d[k]
                            if isinstance(v, (list, dict)):
                                print(" ", k, "len", len(v))
                            else:
                                print(" ", k, v)
    except Exception as e:
        print("FAIL", url, type(e).__name__)
PY

echo
echo "========== DONE APP homepage =========="
echo "DISCOVER_OK app=homepage"
