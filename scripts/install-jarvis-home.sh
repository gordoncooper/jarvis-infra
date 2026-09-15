#!/bin/bash
# Build jarvis-home image on apps-01 and import into k3s containerd.
#
# Required BEFORE Flux applies the homepage Deployment (imagePullPolicy: Never).
# Home (/) and Status (/status) are both in this image.
# Tag comes from VERSION unless JARVIS_HOME_TAG is set.
# Run on bastion as agent.
set -euo pipefail

echo "== who =="
whoami
echo "HOME=$HOME"
if [ "$(whoami)" != "agent" ]; then
  echo "FATAL: run as user agent (sudo su - agent). HOME must be /home/agent." >&2
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck disable=SC1091
. "$ROOT/VERSION"
SRC="$ROOT/apps/jarvis-home"
HOST="${1:-apps-01}"
TAG="${JARVIS_HOME_TAG:-$IMAGE_TAG}"

echo "== paths =="
echo "ROOT=$ROOT SRC=$SRC HOST=$HOST TAG=$TAG (VERSION IMAGE_TAG=$IMAGE_TAG GIT_TAG=$GIT_TAG)"
ls -ld "$SRC" "$SRC/output" "$SRC/Dockerfile" || {
  echo "FATAL: missing apps/jarvis-home (Dockerfile + output/). Clone jarvis-infra fully." >&2
  exit 1
}

echo "== docker on $HOST =="
ssh -n -o BatchMode=yes "$HOST" 'sudo apt-get update -qq && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y docker.io'

echo "== upload build context =="
tar -C "$SRC" -czf /tmp/jarvis-home-src.tgz Dockerfile output
scp -o BatchMode=yes /tmp/jarvis-home-src.tgz "$HOST:/tmp/jarvis-home-src.tgz"

echo "== docker build + k3s ctr import ($TAG) =="
ssh -o BatchMode=yes "$HOST" "sudo env TAG=$TAG bash -s" << 'EOF'
set -euo pipefail
rm -rf /tmp/jarvis-home-build
mkdir -p /tmp/jarvis-home-build
tar -C /tmp/jarvis-home-build -xzf /tmp/jarvis-home-src.tgz
cd /tmp/jarvis-home-build
docker build -t "jarvis-home:${TAG}" .
docker save "jarvis-home:${TAG}" | k3s ctr images import -
k3s ctr images ls | grep jarvis-home
rm -rf /tmp/jarvis-home-build /tmp/jarvis-home-src.tgz
EOF

rm -f /tmp/jarvis-home-src.tgz
echo "OK  docker.io/library/jarvis-home:${TAG} on $HOST"
echo "Flux YAML: clusters/jarvis/apps/homepage.yaml  imagePullPolicy: Never"
echo "If the pod is ImageNeverPull: kubectl -n apps delete pod -l app=homepage"
echo "Do not retag git. Image tag and GIT_TAG ($GIT_TAG) are independent."
