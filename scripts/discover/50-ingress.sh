#!/bin/bash
# Layer 50 — Ingress / TLS. Hosts + HTTP codes. No PEM, no Secret data.
set -euo pipefail
if [ "$(whoami)" != agent ]; then echo FATAL: run as agent >&2; exit 1; fi
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

printf '\n========== 50-INGRESS ==========\n'
date -Is

echo
echo "--- ingress hosts ---"
kubectl get ingress -A -o custom-columns=NS:.metadata.namespace,NAME:.metadata.name,CLASS:.spec.ingressClassName,HOSTS:.spec.rules[*].host,TLS:.spec.tls[*].hosts,PORTS:.spec.rules[*].http.paths[*].backend.service.port.number --no-headers 2>/dev/null || echo "ingress MISS"

echo
echo "--- traefik ---"
kubectl -n kube-system get deploy,svc,ds -l app.kubernetes.io/name=traefik -o wide 2>/dev/null | awk 'NF{print}' || \
kubectl -n kube-system get deploy traefik -o wide 2>/dev/null || echo "traefik MISS"

echo
echo "--- TLS secret NAMES (no data) ---"
kubectl get secrets -A --field-selector type=kubernetes.io/tls -o custom-columns=NS:.metadata.namespace,NAME:.metadata.name,TYPE:.type --no-headers 2>/dev/null | head -40

echo
echo "--- mkcert / LAN CA meta (bastion, no PEM) ---"
if command -v mkcert >/dev/null 2>&1; then
  echo -n "mkcert "; mkcert -version 2>/dev/null | head -1
  CAROOT=$(mkcert -CAROOT 2>/dev/null || true)
  echo "CAROOT=$CAROOT"
  if [ -n "$CAROOT" ] && [ -d "$CAROOT" ]; then
    ls -l "$CAROOT" | awk '{print $1,$5,$9}'
  fi
else
  echo "mkcert MISS"
fi

echo
echo "--- curl hosts (code + ctype, no body) ---"
probe() {
  local url="$1"
  local code ctype
  code=$(curl -sS -k -o /dev/null -w '%{http_code}' --connect-timeout 5 --max-time 15 "$url" 2>/dev/null || echo FAIL)
  ctype=$(curl -sS -k -D - -o /dev/null --connect-timeout 5 --max-time 15 "$url" 2>/dev/null | awk -F': ' 'tolower($1)=="content-type"{print $2; exit}' | tr -d '\r')
  echo "$code  $url  $ctype"
}
probe "http://git.lan/"
probe "https://git.lan/"
probe "https://home.lan/"
probe "https://home.lan/status"
probe "https://jarvis.lan/health"
probe "https://noc.lan/"
probe "https://chat.lan/"
probe "https://llm.lan/"
probe "https://grafana.lan/"
probe "http://agent.lan:18789/healthz"
probe "https://agent.lan/"

echo
echo "--- expected split ---"
echo "git.lan HTTP only; agent.lan:18789 HTTP; others HTTPS"

echo
echo "========== DONE 50-INGRESS =========="
echo "DISCOVER_OK layer=ingress no PEM"
