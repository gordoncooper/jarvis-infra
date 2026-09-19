#!/bin/bash
# Layer 90 — copilot handoff docs + contract. Does NOT run the old fat copilot-discover.
set -euo pipefail
if [ "$(whoami)" != agent ]; then echo FATAL: run as agent >&2; exit 1; fi
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CLUSTER="${JARVIS_CLUSTER:-$HOME/cluster}"
. "$ROOT/VERSION"

printf '\n========== 90-COPILOT ==========\n'
date -Is
echo "GIT_TAG=$GIT_TAG IMAGE=$IMAGE K3S=$K3S"

echo
echo "--- layered discover scripts ---"
ls -1 "$ROOT/scripts/discover"/*.sh | xargs -n1 basename

echo
echo "--- discover apps ---"
ls -1 "$ROOT/scripts/discover/apps"/*.sh | xargs -n1 basename | sed "s|^|apps/|"

echo
echo "--- infra docs (bytes) ---"
for f in README.md VERSION AGENTS.md docs/DECISIONS.md docs/VISION.md docs/INTERACT.md docs/LESSONS.md docs/OPERATING.md docs/REBUILD.md docs/briefing.md; do
  if [ -f "$ROOT/$f" ]; then
    wc -c "$ROOT/$f" | awk '{printf "OK %6s %s\n",$1,$2}'
  else
    echo "MISS $f"
  fi
done

echo
echo "--- cluster docs ---"
for f in README.md AGENTS.md CHANGELOG.md docs/README.md; do
  if [ -f "$CLUSTER/$f" ]; then
    wc -c "$CLUSTER/$f" | awk '{printf "OK %6s %s\n",$1,$2}'
  else
    echo "MISS cluster/$f"
  fi
done

echo
echo "--- old fat copilot-discover (must not be required) ---"
if [ -e "$ROOT/scripts/copilot-discover.sh" ]; then
  echo "WARN present — should stay removed"
else
  echo "absent (use scripts/discover/NN-*.sh + apps/)"
fi

echo
echo "--- check-contract ---"
if [ -x "$ROOT/scripts/check-contract.sh" ]; then
  "$ROOT/scripts/check-contract.sh"
else
  echo "check-contract MISS"
fi

echo
echo "--- describe ---"
echo -n "infra "; git -C "$ROOT" describe --tags --always
echo -n "cluster "; git -C "$CLUSTER" describe --tags --always 2>/dev/null || echo MISS

echo
echo "========== DONE 90-COPILOT =========="
echo "DISCOVER_OK layer=copilot"
