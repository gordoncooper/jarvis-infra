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
echo "--- homepage (infra VERSION image, Never) ---"
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
echo "--- product images (jarvis-app VERSION) ---"
APP="${JARVIS_APP:-$HOME/jarvis-app}"
if [ -f "$APP/VERSION" ]; then
  # Subshell so this file's GIT_TAG does not replace the infra pin.
  (
    # shellcheck disable=SC1091
    . "$APP/VERSION"
    echo "orch_pin=${IMAGE_ORCHESTRATOR}:${IMAGE_ORCHESTRATOR_TAG}"
    echo "glass_pin=${IMAGE_GLASS}:${IMAGE_GLASS_TAG} theme=${JARVIS_THEME}"
    kubectl -n apps get deploy jarvis-orchestrator jarvis-glass -o json \
      | ORCH="${IMAGE_ORCHESTRATOR}:${IMAGE_ORCHESTRATOR_TAG}" \
        GLASS="${IMAGE_GLASS}:${IMAGE_GLASS_TAG}" python3 -c '
import json,os,sys
d=json.load(sys.stdin)
want={"jarvis-orchestrator": os.environ["ORCH"], "jarvis-glass": os.environ["GLASS"]}
for it in d.get("items",[]):
    name=it["metadata"]["name"]
    c=it["spec"]["template"]["spec"]["containers"][0]
    img=c.get("image")
    print(name, img, "policy", c.get("imagePullPolicy"), "PIN_MATCH", img==want.get(name))
'
  )
else
  echo "jarvis-app VERSION MISS $APP"
fi

echo
echo "--- non-Running pods (if any) ---"
kubectl get pods -A --field-selector=status.phase!=Running,status.phase!=Succeeded --no-headers 2>/dev/null | head -20 || echo none

echo
echo "========== DONE 60-WORKLOADS =========="
echo "DISCOVER_OK layer=workloads no helm secrets"
