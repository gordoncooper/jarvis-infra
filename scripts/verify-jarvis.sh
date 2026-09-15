#!/bin/bash
# Run on bastion as agent. Does not call jarvis-grok (saves API $).
set -u
echo "======== JARVIS VERIFY $(date -Is) ========"

echo; echo "----- nodes -----"
kubectl get nodes -o wide
kubectl get nodes -o jsonpath='{range .items[*]}{.metadata.name}{"  "}{.status.addresses[?(@.type=="InternalIP")].address}{"  "}{.metadata.labels.jarvis\.role}{" "}{.metadata.labels.jarvis\.gpu}{" "}{.metadata.labels.jarvis\.storage}{"\n"}{end}'

echo; echo "----- pods (non-Succeeded) -----"
kubectl get pods -A --field-selector=status.phase!=Succeeded

echo; echo "----- gpu -----"
for n in gpu-01 gpu-02; do
  kubectl get node "$n" -o jsonpath="$n gpu={.status.capacity.nvidia\.com/gpu} alloc={.status.allocatable.nvidia\.com/gpu}{'\n'}"
  ssh "$n" 'nvidia-smi --query-gpu=name,memory.used,memory.total,utilization.gpu,temperature.gpu --format=csv'
done

echo; echo "----- ollama -----"
kubectl -n inference exec deploy/ollama -- ollama list
kubectl -n inference exec deploy/ollama-embed -- ollama list

echo; echo "----- nfs -----"
for h in ctrl-01 gpu-01 gpu-02 data-01 data-02 apps-01; do
  mnt=$(ssh "$h" 'findmnt -n -o TARGET,SOURCE /mnt/nfs 2>/dev/null || true')
  printf '%-10s %s\n' "$h" "${mnt:-server-or-unmounted}"
done

echo; echo "----- flux -----"
kubectl -n flux-system get kustomization flux-system

echo; echo "----- ingress / dns -----"
kubectl get ingress -A
getent hosts git.lan jarvis.lan llm.lan chat.lan home.lan grafana.lan agent.lan

echo; echo "----- http/https -----"
code() { curl -skS -o /dev/null -w "%{http_code}" --max-time 8 "$1" || echo ERR; }
echo "gitea_http   $(code http://git.lan/api/healthz)"
echo "chat_https   $(code https://chat.lan/health)"
echo "home_https   $(code https://home.lan/)"
echo "home_status  $(code https://home.lan/status)"
echo "grafana_https $(code https://grafana.lan/)"
echo "llm_https    $(code https://llm.lan/health/liveliness)"
echo "agent_18789  $(code http://agent.lan:18789/)"

echo; echo "----- homepage image -----"
kubectl -n apps get deploy homepage -o jsonpath='image={.spec.template.spec.containers[0].image} policy={.spec.template.spec.containers[0].imagePullPolicy}{"\n"}' 2>/dev/null || echo "NO_DEPLOY"
kubectl -n apps get pods -l app=homepage -o wide 2>/dev/null || true

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
ssh data-01 'ls -lh /cluster/nfs/snapshots | tail -5'

echo; echo "======== END VERIFY ========"
