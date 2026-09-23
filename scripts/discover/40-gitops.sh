#!/bin/bash
# Layer 40 — GitOps. Flux origin must be Gitea. No tokens. No Secret data.
set -euo pipefail
if [ "$(whoami)" != agent ]; then echo FATAL: run as agent >&2; exit 1; fi
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CLUSTER="${JARVIS_CLUSTER:-$HOME/cluster}"
strip() { sed -E 's#://[^/@]+@#://#g'; }

printf '\n========== 40-GITOPS ==========\n'
date -Is

echo
echo "--- local remotes (tokens stripped) ---"
APP="${JARVIS_APP:-$HOME/jarvis-app}"
for spec in "infra:$ROOT" "cluster:$CLUSTER" "app:$APP"; do
  label="${spec%%:*}"
  dir="${spec#*:}"
  echo "$label $dir"
  if [ -d "$dir/.git" ]; then
    echo -n "  HEAD "; git -C "$dir" rev-parse --short HEAD
    echo -n "  describe "; git -C "$dir" describe --tags --always
    git -C "$dir" status -sb | head -3 | sed 's/^/  /'
    git -C "$dir" remote -v | strip | awk '{print "  remote",$1,$2,$3}' | sort -u
    git -C "$dir" branch -vv | head -5 | sed 's/^/  /'
  else
    echo "  git=MISS"
  fi
done

echo
echo "--- Flux GitRepository (url + revision only) ---"
if kubectl -n flux-system get gitrepository flux-system >/dev/null 2>&1; then
  kubectl -n flux-system get gitrepository flux-system \
    -o custom-columns=NAME:.metadata.name,URL:.spec.url,READY:.status.conditions[0].status,REVISION:.status.artifact.revision --no-headers
  echo -n "flux_url "
  kubectl -n flux-system get gitrepository flux-system -o jsonpath='{.spec.url}'; echo
  echo -n "flux_rev "
  kubectl -n flux-system get gitrepository flux-system -o jsonpath='{.status.artifact.revision}'; echo
  URL=$(kubectl -n flux-system get gitrepository flux-system -o jsonpath='{.spec.url}')
  case "$URL" in
    *git.lan/jarvis/cluster*) echo "ORIGIN_OK gitea" ;;
    *github.com*) echo "ORIGIN_FAIL points at GitHub" ;;
    *) echo "ORIGIN_UNEXPECTED $URL" ;;
  esac
else
  echo "GitRepository flux-system MISS"
fi

echo
echo "--- Flux Kustomization ---"
kubectl -n flux-system get kustomization \
  -o custom-columns=NAME:.metadata.name,READY:.status.conditions[0].status,REVISION:.status.lastAppliedRevision --no-headers 2>/dev/null || echo "kustomization MISS"

echo
echo "--- cluster HEAD vs flux SHA ---"
CHEAD=$(git -C "$CLUSTER" rev-parse HEAD 2>/dev/null || echo MISS)
FREV=$(kubectl -n flux-system get gitrepository flux-system -o jsonpath='{.status.artifact.revision}' 2>/dev/null || true)
echo "cluster_HEAD=$CHEAD"
echo "flux_revision=$FREV"
FSHA=${FREV##*:}
if [ -n "$CHEAD" ] && [ "$CHEAD" != MISS ] && echo "$FREV" | grep -q "$CHEAD"; then
  echo "SHA_ALIGN yes"
elif [ -n "$FSHA" ] && [ "$CHEAD" = "$FSHA" ]; then
  echo "SHA_ALIGN yes"
else
  echo "SHA_ALIGN no (ok if local unpushed)"
fi

echo
echo "--- Gitea workload (ns/pod/node, no env) ---"
for ns in git gitea; do
  if kubectl get ns "$ns" >/dev/null 2>&1; then
    echo "ns=$ns"
    kubectl -n "$ns" get deploy,svc,ingress,pod -o wide 2>/dev/null | awk 'NF{print}'
  fi
done

echo
echo "--- git.lan HTTP (no body dump) ---"
code=$(curl -sS -o /dev/null -w '%{http_code}' --connect-timeout 5 http://git.lan/ 2>/dev/null || echo FAIL)
echo "http://git.lan/ -> $code"

echo
echo "========== DONE 40-GITOPS =========="
echo "DISCOVER_OK layer=gitops no tokens"
