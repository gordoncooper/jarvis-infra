#!/bin/bash
# Layer 60 — workloads. Images + pullPolicy. NEVER dump Helm secrets / ENC blobs.
set -euo pipefail
if [ "$(whoami)" != agent ]; then echo FATAL: run as agent >&2; exit 1; fi
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
. "$ROOT/VERSION"

printf '\n========== 60-WORKLOADS ==========\n'
date -Is
echo "pin IMAGE=$IMAGE"

echo
echo "--- deploy/ds/sts (containers, no secrets) ---"
kubectl get deploy,ds,sts -A -o json | python3 -c '
import json,sys
d=json.load(sys.stdin)
print("NS KIND NAME CONT IMAGE POLICY NODESEL")
for it in d.get("items",[]):
    kind=it["kind"]
    ns=it["metadata"]["namespace"]
    name=it["metadata"]["name"]
    spec=it.get("spec",{}).get("template",{}).get("spec",{})
    nselspec=spec.get("nodeSelector") or {}
    nsel=",".join("%s=%s"%(k,v) for k,v in sorted(nselspec.items())) or "-"
    for c in spec.get("containers") or []:
        img=c.get("image","")
        pol=c.get("imagePullPolicy","")
        print(ns, kind, name, c.get("name"), img, pol, nsel)
'

echo
echo "--- homepage (must Never + apps-01 + IMAGE pin) ---"
kubectl -n apps get deploy homepage -o json | python3 -c '
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
echo "--- non-Running pods (if any) ---"
kubectl get pods -A --field-selector=status.phase!=Running,status.phase!=Succeeded --no-headers 2>/dev/null | head -20 || echo none

echo
echo "========== DONE 60-WORKLOADS =========="
echo "DISCOVER_OK layer=workloads no helm secrets"
