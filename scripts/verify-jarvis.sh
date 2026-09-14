#!/bin/bash
# Run on bastion as agent. Does not call jarvis-grok (saves API $).
set -u
echo "======== JARVIS VERIFY $(date -Is) ========"

echo; echo "----- nodes -----"
kubectl get nodes -o wide
echo
kubectl get nodes -o jsonpath='{range .items[*]}{.metadata.name}{"  "}{.status.addresses[?(@.type=="InternalIP")].address}{"  "}{.metadata.labels.jarvis\.role}{" "}{.metadata.labels.jarvis\.gpu}{" "}{.metadata.labels.jarvis\.storage}{"\n"}{end}'

echo; echo "----- pods (non-Succeeded) -----"
kubectl get pods -A --field-selector=status.phase!=Succeeded

echo; echo "----- gpu -----"
kubectl get node gpu-01 -o jsonpath='gpu={.status.capacity.nvidia\.com/gpu}  alloc={.status.allocatable.nvidia\.com/gpu}{"\n"}'
ssh gpu-01 'nvidia-smi --query-gpu=name,memory.used,memory.total,utilization.gpu,temperature.gpu --format=csv'

echo; echo "----- ollama models -----"
kubectl -n inference exec deploy/ollama -- ollama list
kubectl -n inference get deploy ollama -o jsonpath='KEEP_ALIVE={.spec.template.spec.containers[0].env[?(@.name=="OLLAMA_KEEP_ALIVE")].value}{"\n"}'

echo; echo "----- nfs -----"
for h in ctrl-01 gpu-01 data-01 data-02 apps-01; do
  mnt=$(ssh "$h" 'findmnt -n -o TARGET,SOURCE /mnt/nfs 2>/dev/null || true')
  printf '%-10s %s\n' "$h" "${mnt:-server-or-unmounted}"
done
ssh data-01 'echo -n "export: "; sudo exportfs -v | head -1; echo -n "snapshots: "; ls /cluster/nfs/snapshots 2>/dev/null | wc -l; df -h /cluster | tail -1'

echo; echo "----- flux -----"
kubectl -n flux-system get kustomization,gitrepository

echo; echo "----- ingress / dns -----"
kubectl get ingress -A
getent hosts git.lan jarvis.lan llm.lan chat.lan ctrl-01.lan

echo; echo "----- http -----"
code() { curl -sS -o /dev/null -w "%{http_code}" --max-time 8 "$1" || echo ERR; }
echo "gitea      $(code http://git.lan/api/healthz)"
echo "chat       $(code http://chat.lan/health)"
echo "jarvis     $(code http://jarvis.lan/health)"
echo "llm_live   $(code http://llm.lan/health/liveliness)"

echo; echo "----- litellm local -----"
KEY=$(cat ~/.litellm-master.key)
curl -sS --max-time 60 http://llm.lan/v1/chat/completions \
  -H "Authorization: Bearer $KEY" -H 'Content-Type: application/json' \
  -d '{"model":"jarvis-local","messages":[{"role":"user","content":"Reply with exactly: cluster-ok"}],"max_tokens":8,"stream":false}' \
  | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("choices",[{}])[0].get("message",{}).get("content") or d)'

echo; echo "----- open-webui env dups -----"
kubectl -n apps get deploy open-webui -o jsonpath='{range .spec.template.spec.containers[0].env[*]}{.name}{"\n"}{end}' \
  | sort | uniq -c | awk '$1>1{print "DUP",$0} END{}'
echo "(no DUP lines = ok)"

echo; echo "----- goose -----"
command -v goose; goose --version
grep -E 'GOOSE_|OPENAI_HOST|MODEL' ~/.config/goose/config.yaml | sed 's/KEY:.*/KEY: *** /'

echo; echo "----- disk / chrony -----"
for h in ctrl-01 gpu-01 data-01 data-02 apps-01; do
  ssh "$h" 'printf "%-10s root=%s cluster=%s chrony=%s\n" "$(hostname)" "$(df -h / | awk "NR==2{print \$5}")" "$(df -h /cluster 2>/dev/null | awk "NR==2{print \$5}")" "$(chronyc tracking 2>/dev/null | awk "/Leap status/{print \$4}")"'
done

echo; echo "----- etcd snapshots -----"
ssh data-01 'ls -lh /cluster/nfs/snapshots | tail -8'

echo; echo "======== END VERIFY ========"
