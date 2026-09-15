#!/bin/bash
# File-level pin check. Run on bastion as agent.
# Does not talk to the cluster (see verify-jarvis.sh for that).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck disable=SC1091
. "$ROOT/VERSION"

fail=0
say() { printf '%s\n' "$*"; }
bad() { printf 'FAIL  %s\n' "$*" >&2; fail=1; }
ok()  { printf 'OK    %s\n' "$*"; }

say "== contract =="
say "GIT_TAG=$GIT_TAG  IMAGE=$IMAGE  K3S=$K3S"

for v in GIT_TAG IMAGE_TAG IMAGE K3S; do
  eval "val=\${$v-}"
  [ -n "$val" ] || bad "VERSION missing $v"
done
[ "$IMAGE" = "docker.io/library/jarvis-home:${IMAGE_TAG}" ] || \
  bad "IMAGE must be docker.io/library/jarvis-home:\$IMAGE_TAG (got $IMAGE)"

check_yaml() {
  local f=$1
  [ -f "$f" ] || { bad "missing $f"; return 0; }
  grep -q "image: ${IMAGE}" "$f" || bad "$f image != $IMAGE"
  grep -q "imagePullPolicy: Never" "$f" || bad "$f missing imagePullPolicy Never"
  grep -q "serviceAccountName: homepage" "$f" || bad "$f missing SA homepage"
  grep -q "image: ${IMAGE}" "$f" && grep -q "imagePullPolicy: Never" "$f" && \
    grep -q "serviceAccountName: homepage" "$f" && ok "$f"
  return 0
}

check_yaml "$ROOT/apps/jarvis-home/homepage.yaml"
for f in \
  "${CLUSTER_YAML:-$HOME/cluster/clusters/jarvis/apps/homepage.yaml}" \
  "${HOME}/cluster/k8s/apps/homepage.yaml"
do
  [ -f "$f" ] && check_yaml "$f"
done

REBUILD="$ROOT/docs/REBUILD.md"
stale=$(grep -nE 'jarvis-home:v0\.[0-9]|git checkout v0\.[0-9]' "$REBUILD" || true)
if [ -n "$stale" ]; then
  printf '%s\n' "$stale"
  bad "docs/REBUILD.md still hardcodes a tag — quote VERSION instead"
else
  ok "docs/REBUILD.md has no hardcoded image/git pins"
fi

if grep -nE 'JARVIS_HOME_TAG:-\s*v0\.' "$ROOT/scripts/install-jarvis-home.sh"; then
  bad "install-jarvis-home.sh has a hardcoded default tag — source VERSION"
else
  ok "install-jarvis-home.sh defaults from VERSION"
fi

say "== done =="
if [ "$fail" -ne 0 ]; then
  say "CONTRACT FAIL"
  exit 1
fi
say "CONTRACT OK"
