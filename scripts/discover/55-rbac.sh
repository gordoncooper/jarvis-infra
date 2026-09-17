#!/bin/bash
# Layer 55 — RBAC names and rule resources. No Secret data, no tokens.
set -euo pipefail
if [ "$(whoami)" != agent ]; then echo FATAL: run as agent >&2; exit 1; fi

printf '\n========== 55-RBAC ==========\n'
date -Is

echo
echo "--- serviceaccounts (ns name) ---"
kubectl get sa -A --no-headers | awk '{print $1, $2}'

echo
echo "--- clusterrole / binding counts ---"
echo -n "clusterroles "; kubectl get clusterrole --no-headers | wc -l
echo -n "clusterrolebindings "; kubectl get clusterrolebinding --no-headers | wc -l

echo
echo "--- names matching homepage|openclaw|jarvis ---"
kubectl get clusterrole,clusterrolebinding,role,rolebinding,sa -A --no-headers 2>/dev/null \
  | grep -Ei 'homepage|openclaw|jarvis' || echo none

echo
echo "--- rule resources (matching ClusterRoles only) ---"
kubectl get clusterrole -o json | python3 -c '
import json,sys
d=json.load(sys.stdin)
want=("homepage","openclaw","jarvis")
for it in d.get("items",[]):
    name=it["metadata"]["name"]
    if not any(w in name.lower() for w in want):
        continue
    print("CLUSTERROLE", name)
    for rule in it.get("rules") or []:
        api=rule.get("apiGroups")
        res=rule.get("resources")
        verbs=rule.get("verbs")
        print(" ", "api", api, "res", res, "verbs", verbs)
'

echo
echo "--- Role rules (homepage/openclaw/jarvis) ---"
kubectl get role -A -o json | python3 -c '
import json,sys
d=json.load(sys.stdin)
want=("homepage","openclaw","jarvis")
n=0
for it in d.get("items",[]):
    name=it["metadata"]["name"]
    ns=it["metadata"]["namespace"]
    if not any(w in name.lower() for w in want):
        continue
    n+=1
    print("ROLE", ns+"/"+name)
    for rule in it.get("rules") or []:
        print(" ", "api", rule.get("apiGroups"), "res", rule.get("resources"), "verbs", rule.get("verbs"))
if n==0:
    print("none")
'

echo
echo "========== DONE 55-RBAC =========="
echo "DISCOVER_OK layer=rbac no secrets"
