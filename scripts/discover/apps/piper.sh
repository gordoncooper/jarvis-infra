#!/bin/bash
# App probe — Piper TTS. Voice filenames + map speaker ids. No audio blobs.
set -euo pipefail
if [ "$(whoami)" != agent ]; then echo FATAL: run as agent >&2; exit 1; fi

printf '\n========== APP piper ==========\n'
date -Is

echo
echo "--- deploy ---"
kubectl -n apps get deploy piper -o json | python3 -c '
import json,sys
d=json.load(sys.stdin)
spec=d["spec"]["template"]["spec"]
c=spec["containers"][0]
print("image", c.get("image"))
print("policy", c.get("imagePullPolicy"))
print("sa", spec.get("serviceAccountName"))
print("nodesel", spec.get("nodeSelector"))
print("env", sorted(e.get("name") for e in (c.get("env") or [])))
print("mounts", sorted((m.get("name"), m.get("mountPath")) for m in (c.get("volumeMounts") or [])))
'
kubectl -n apps get pod -l app=piper -o wide --no-headers

echo
echo "--- voices hostPath (names) ---"
ssh -n -o BatchMode=yes apps-01 'sudo ls -lh /cluster/local/piper | awk "{print \$1, \$5, \$9}"'

echo
echo "--- voice map in pod (ids only) ---"
POD=$(kubectl -n apps get pod -l app=piper -o jsonpath="{.items[0].metadata.name}")
echo "pod=$POD"
kubectl -n apps exec "$POD" -- python3 -c '
from pathlib import Path
p = Path("/app/config/voice_to_speaker.yaml")
print("map_exists", p.is_file(), "bytes", p.stat().st_size if p.is_file() else 0)
print(p.read_text()[:1200] if p.is_file() else "MISS")
'

echo
echo "--- /v1/models ---"
python3 - << 'PY'
import json, urllib.request, subprocess
ip = subprocess.check_output(["kubectl","-n","apps","get","svc","piper","-o","jsonpath={.spec.clusterIP}"], text=True).strip()
url = f"http://{ip}:8000/v1/models"
try:
    with urllib.request.urlopen(url, timeout=8) as r:
        d = json.loads(r.read().decode())
        print("svc", url, "ids", [x.get("id") for x in d.get("data") or []])
except Exception as e:
    print("FAIL", type(e).__name__)
PY

echo
echo "========== DONE APP piper =========="
echo "DISCOVER_OK app=piper no audio dump"
