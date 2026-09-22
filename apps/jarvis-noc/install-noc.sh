#!/usr/bin/env bash
# Build jarvis-noc on apps-01, import into k3s on apps-01 and ctrl-01.
# imagePullPolicy: Never — the image must exist on the node that runs the pod.
# Run on bastion as agent.
#
# Moved here from the retired jarvis-core repo (D-0038). noc.lan is the
# operator surface that has to render when the brain is down (VISION), and its
# only definition used to live inside prior art nobody was maintaining.
#
# The manifest is no longer applied by this script: it is Flux-managed at
# cluster/clusters/jarvis/apps/jarvis-noc.yaml. This script builds and imports
# the image, which Flux cannot do because imagePullPolicy is Never.
set -euo pipefail

echo "== who =="
whoami
if [ "$(whoami)" != "agent" ]; then
  echo "FATAL: run as user agent (sudo su - agent)." >&2
  exit 1
fi

SRC="$(cd "$(dirname "$0")" && pwd)"
BUILD_HOST="${BUILD_HOST:-apps-01}"
RUN_HOST="${RUN_HOST:-ctrl-01}"
# Pin lives here, beside the source. Bump it and the Flux manifest together;
# imagePullPolicy: Never means a reused tag silently serves the old layers.
IMAGE="${IMAGE_NOC:-docker.io/library/jarvis-noc:v0.1.0}"

echo "== pins =="
echo "SRC=$SRC IMAGE=$IMAGE BUILD=$BUILD_HOST RUN=$RUN_HOST"

ls -ld "$SRC/Dockerfile" "$SRC/collector/server.py" "$SRC/ui/index.html" || {
  echo "FATAL: missing noc build context" >&2
  exit 1
}

echo "== docker on $BUILD_HOST =="
ssh -n -o BatchMode=yes "$BUILD_HOST" \
  'sudo apt-get update -qq && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y docker.io'

echo "== upload build context =="
tar -C "$SRC" -czf /tmp/jarvis-noc-src.tgz Dockerfile collector ui
scp -o BatchMode=yes /tmp/jarvis-noc-src.tgz "$BUILD_HOST:/tmp/jarvis-noc-src.tgz"

echo "== docker build + k3s ctr import on $BUILD_HOST =="
ssh -o BatchMode=yes "$BUILD_HOST" "sudo env IMAGE=$IMAGE bash -s" << 'EOF'
set -euo pipefail
rm -rf /tmp/jarvis-noc-build
mkdir -p /tmp/jarvis-noc-build
tar -C /tmp/jarvis-noc-build -xzf /tmp/jarvis-noc-src.tgz
cd /tmp/jarvis-noc-build
docker build -t "$IMAGE" .
docker save "$IMAGE" | k3s ctr images import -
k3s ctr images ls | grep jarvis-noc || true
docker save "$IMAGE" -o /tmp/jarvis-noc-image.tar
chmod 644 /tmp/jarvis-noc-image.tar
rm -rf /tmp/jarvis-noc-build /tmp/jarvis-noc-src.tgz
EOF

echo "== copy image tar to $RUN_HOST and import =="
scp -o BatchMode=yes "$BUILD_HOST:/tmp/jarvis-noc-image.tar" /tmp/jarvis-noc-image.tar
scp -o BatchMode=yes /tmp/jarvis-noc-image.tar "$RUN_HOST:/tmp/jarvis-noc-image.tar"
ssh -o BatchMode=yes "$RUN_HOST" "sudo k3s ctr images import /tmp/jarvis-noc-image.tar && sudo rm -f /tmp/jarvis-noc-image.tar"
ssh -o BatchMode=yes "$BUILD_HOST" "sudo rm -f /tmp/jarvis-noc-image.tar"
rm -f /tmp/jarvis-noc-src.tgz /tmp/jarvis-noc-image.tar

echo "== manifests are Flux-managed; reconcile rather than apply =="
flux reconcile kustomization flux-system || true
kubectl -n apps rollout status deploy/jarvis-noc --timeout=120s || {
  echo "rollout failed — check nodeSelector jarvis.role=control and ImageNeverPull" >&2
  kubectl -n apps describe deploy/jarvis-noc | tail -40
  kubectl -n apps get po -l app=jarvis-noc -o wide
  exit 1
}

echo "== proof =="
kubectl -n apps get po,ing -l app=jarvis-noc -o wide
curl -skI https://noc.lan/health || true
curl -sk https://noc.lan/health || true
echo "OK  $IMAGE on $BUILD_HOST and $RUN_HOST"
