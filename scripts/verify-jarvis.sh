#!/bin/bash
# Run on bastion as agent. Does not call jarvis-grok (saves API $).
# Exit 0 only if the living homepage contract in VERSION matches the cluster.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck disable=SC1091
. "$ROOT/VERSION"
fail=0
bad() { printf 'FAIL  %s\n' "$*" >&2; fail=1; }

echo "======== JARVIS VERIFY $(date -Is) ========"
echo "VERSION GIT_TAG=$GIT_TAG IMAGE=$IMAGE"

echo; echo "----- nodes -----"
kubectl get nodes -o wide
kubectl get nodes -o jsonpath='{range .items[*]}{.metadata.name}{"  "}{.status.addresses[?(@.type=="InternalIP")].address}{"  "}{.metadata.labels.jarvis\.role}{" "}{.metadata.labels.jarvis\.gpu}{" "}{.metadata.labels.jarvis\.storage}{"\n"}{end}'

echo; echo "----- pods (non-Succeeded) -----"
kubectl get pods -A --field-selector=status.phase!=Succeeded

echo; echo "----- gpu -----"
for n in gpu-01 gpu-02; do
  kubectl get node "$n" -o jsonpath="$n gpu={.status.capacity.nvidia\.com/gpu} alloc={.status.allocatable.nvidia\.com/gpu}{'\n'}"
  ssh -n -o BatchMode=yes "$n" 'nvidia-smi --query-gpu=name,memory.used,memory.total,utilization.gpu,temperature.gpu --format=csv'
done

echo; echo "----- ollama -----"
kubectl -n inference exec deploy/ollama -- ollama list
kubectl -n inference exec deploy/ollama-embed -- ollama list

echo; echo "----- nfs -----"
for h in ctrl-01 gpu-01 gpu-02 data-01 data-02 apps-01; do
  mnt=$(ssh -n -o BatchMode=yes "$h" 'findmnt -n -o TARGET,SOURCE /mnt/nfs 2>/dev/null || true')
  printf '%-10s %s\n' "$h" "${mnt:-server-or-unmounted}"
done

echo; echo "----- flux -----"
kubectl -n flux-system get kustomization flux-system

echo; echo "----- ingress / dns -----"
kubectl get ingress -A
getent hosts git.lan jarvis.lan llm.lan chat.lan home.lan grafana.lan agent.lan

echo; echo "----- http/https -----"
code() { curl -skS -o /dev/null -w "%{http_code}" --max-time 8 "$1" || echo ERR; }
gitea_http=$(code http://git.lan/api/healthz)
chat_https=$(code https://chat.lan/health)
home_https=$(code https://home.lan/)
home_status=$(code https://home.lan/status)
grafana_https=$(code https://grafana.lan/)
llm_https=$(code https://llm.lan/health/liveliness)
agent_18789=$(code http://agent.lan:18789/)
echo "gitea_http   $gitea_http"
echo "chat_https   $chat_https"
echo "home_https   $home_https"
echo "home_status  $home_status"
echo "grafana_https $grafana_https"
echo "llm_https    $llm_https"
echo "agent_18789  $agent_18789"
[ "$home_https" = 200 ] || bad "home.lan HTTP $home_https want 200"
[ "$home_status" = 200 ] || bad "home.lan/status HTTP $home_status want 200"

echo; echo "----- homepage contract -----"
got=$(kubectl -n apps get deploy homepage -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null || echo NO_DEPLOY)
policy=$(kubectl -n apps get deploy homepage -o jsonpath='{.spec.template.spec.containers[0].imagePullPolicy}' 2>/dev/null || echo none)
sa=$(kubectl -n apps get deploy homepage -o jsonpath='{.spec.template.spec.serviceAccountName}' 2>/dev/null || echo none)
echo "want=$IMAGE"
echo "image=$got policy=$policy sa=$sa"
kubectl -n apps get pods -l app=homepage -o wide 2>/dev/null || true
[ "$got" = "$IMAGE" ] || bad "deploy image $got != VERSION $IMAGE"
[ "$policy" = Never ] || bad "imagePullPolicy $policy != Never"
[ "$sa" = homepage ] || bad "serviceAccountName $sa != homepage"

echo; echo "----- telemetry -----"
tel=$(curl -skS --max-time 8 https://home.lan/api/telemetry || echo '{}')
echo "$tel" | python3 -c '
import json, sys
d = json.load(sys.stdin)
src = d.get("source")
ev = d.get("events") or []
print("source", src, "events", len(ev), "window", d.get("eventWindowSec"))
if ev:
    print("newest", ev[0].get("src"), (ev[0].get("msg") or "")[:80])
sys.exit(0 if src == "live" else 2)
' || bad "telemetry source is not live"

echo; echo "----- litellm local -----"
KEY=$(cat ~/.litellm-master.key)
curl -skS --max-time 60 https://llm.lan/v1/chat/completions \
  -H "Authorization: Bearer $KEY" -H 'Content-Type: application/json' \
  -d '{"model":"jarvis-local","messages":[{"role":"user","content":"Reply with exactly: cluster-ok"}],"max_tokens":8,"stream":false}' \
  | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("choices",[{}])[0].get("message",{}).get("content") or d)'

echo; echo "----- git tags -----"
git -C "$HOME/cluster" describe --tags --always 2>/dev/null || true
git -C "$HOME/jarvis-infra" describe --tags --always 2>/dev/null || true

echo; echo "----- etcd snapshots -----"
ssh -n -o BatchMode=yes data-01 'ls -lh /cluster/nfs/snapshots | tail -5'

echo; echo "----- files -----"
if bash "$ROOT/scripts/check-contract.sh"; then
  echo "files CONTRACT OK"
else
  bad "check-contract.sh"
fi

echo; echo "======== END VERIFY ========"
if [ "$fail" -ne 0 ]; then
  echo "VERIFY FAIL"
  exit 1
fi
echo "VERIFY OK  $IMAGE"
exit 0
