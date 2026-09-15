#!/bin/bash
# One-shot on bastion as agent: rebuild jarvis-home:v0.2, point Flux at it,
# wait until home.lan is 200. Import the image BEFORE the git push.
set -euo pipefail

echo "== who =="
whoami
echo "HOME=$HOME"
echo "PWD=$PWD"

INFRA="${JARVIS_INFRA:-$HOME/jarvis-infra}"
CLUSTER="${JARVIS_CLUSTER:-$HOME/cluster}"
HOST="${1:-apps-01}"
TAG=v0.2
SRC="$INFRA/apps/jarvis-home"

echo "== paths =="
echo "INFRA=$INFRA"
echo "CLUSTER=$CLUSTER"
echo "SRC=$SRC"
ls -ld "$INFRA" "$SRC" "$SRC/output" "$CLUSTER" || {
  echo "FATAL: missing tree. Run as user agent (not bastion)."
  echo "  sudo -iu agent"
  echo "  ls -ld ~/jarvis-infra/apps/jarvis-home/output ~/cluster"
  exit 1
}

echo "== write Dockerfile =="
mkdir -p "$SRC"
cat > "$SRC/Dockerfile" << 'EOF'
FROM node:22-bookworm-slim
WORKDIR /app/output
COPY output/ ./
RUN npm init -y >/dev/null \
 && npm install --omit=dev srvx@0.11.22
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
EXPOSE 3000
CMD ["node", "./node_modules/srvx/bin/srvx.mjs", "--prod", "--host", "0.0.0.0", "--port", "3000", "--dir", ".", "--static", "static", "--entry", "functions/__server.func/index.mjs"]
EOF

echo "== docker on $HOST =="
ssh -o BatchMode=yes "$HOST" 'sudo apt-get update -qq && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y docker.io'

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

YAML=""
for cand in \
  "$CLUSTER/clusters/jarvis/apps/homepage.yaml" \
  "$CLUSTER/k8s/apps/homepage.yaml"
do
  if [ -f "$cand" ]; then YAML="$cand"; break; fi
done
if [ -z "$YAML" ]; then
  YAML=$(find "$CLUSTER" -name homepage.yaml | head -1 || true)
fi
test -n "${YAML:-}" && test -f "$YAML"
echo "== patch $YAML =="
sed -i 's|jarvis-home:v0.1|jarvis-home:v0.2|g' "$YAML"
grep -n 'image:' "$YAML"

echo "== git commit + push =="
cd "$CLUSTER"
git add -- "$YAML"
if git diff --cached --quiet; then
  echo "no yaml change (already v0.2?)"
else
  git commit -m "apps: jarvis-home v0.2 — srvx --prod, no npx"
  git push
fi

echo "== flux reconcile =="
flux reconcile source git flux-system
flux reconcile kustomization flux-system --with-source

echo "== wait Ready =="
kubectl -n apps rollout status deploy/homepage --timeout=180s
kubectl -n apps get pods -l app=homepage -o wide
kubectl -n apps logs deploy/homepage --tail=40 || true

echo "== curl =="
echo "home $(curl -sk -o /dev/null -w '%{http_code}' https://home.lan/)"
echo "status $(curl -sk -o /dev/null -w '%{http_code}' https://home.lan/status)"
