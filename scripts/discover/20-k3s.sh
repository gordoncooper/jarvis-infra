#!/bin/bash
# Layer 20 — k3s. No tokens/passwords. kubectl on bastion only. Greenfield-safe.
set -euo pipefail
if [ "$(whoami)" != agent ]; then echo FATAL: run as agent >&2; exit 1; fi
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
. "$ROOT/VERSION"

printf '\n========== 20-K3S ==========\n'
date -Is
echo "pin K3S=$K3S"

echo
echo "--- client ---"
if command -v kubectl >/dev/null 2>&1; then
  kubectl version --client 2>/dev/null | head -3
else
  echo "kubectl MISS"
fi

echo
echo "--- server / nodes ---"
if kubectl get --raw /livez >/dev/null 2>&1; then
  echo "apiserver livez=ok"
  kubectl version -o yaml 2>/dev/null | awk '/^(clientVersion|kustomizeVersion|serverVersion):/{p=1} p&&/gitVersion:/{print; if(++n==2) exit}'
  echo "gitVersion pin_match? (server vs VERSION)"
  SV=$(kubectl version -o json 2>/dev/null | python3 -c "import json,sys
d=json.load(sys.stdin)
print(d.get('serverVersion',{}).get('gitVersion',''))" 2>/dev/null || true)
  echo "server=$SV pin=$K3S"
  if [ "$SV" = "$K3S" ]; then echo "MATCH"; else echo "DRIFT"; fi
  echo
  kubectl get nodes -o wide --no-headers
  echo
  echo "--- node labels (jarvis.*) ---"
  kubectl get nodes -o json | python3 -c "
import json,sys
d=json.load(sys.stdin)
for n in d.get('items',[]):
    name=n['metadata']['name']
    labs=n['metadata'].get('labels') or {}
    j={k:v for k,v in labs.items() if k.startswith('jarvis.') or k in ('kubernetes.io/hostname','node-role.kubernetes.io/control-plane')}
    print(name, ' '.join('%s=%s'%(k,v) for k,v in sorted(j.items())))
"
  echo
  echo "--- nodeInfo ---"
  kubectl get nodes -o json | python3 -c "
import json,sys
d=json.load(sys.stdin)
print('NAME VERSION OS RUNTIME KERNEL')
for n in d.get('items',[]):
    i=n['status']['nodeInfo']
    print(n['metadata']['name'], i.get('kubeletVersion'), i.get('osImage'), i.get('containerRuntimeVersion'), i.get('kernelVersion'))
"
else
  echo "apiserver MISS (greenfield or kubeconfig)"
fi

echo
echo "--- ctrl-01 k3s unit / config keys (no tokens) ---"
ssh -n -o BatchMode=yes -o ConnectTimeout=8 ctrl-01 'set +e
echo -n "k3s_bin "; k3s --version 2>/dev/null | head -1
echo -n "unit "; systemctl is-enabled k3s 2>/dev/null; systemctl is-active k3s 2>/dev/null
echo "--- ExecStart (no token flags) ---"
systemctl cat k3s 2>/dev/null | awk "/^ExecStart/{p=1} p{print} /^$/{if(p) exit}" | grep -viE "token|password|secret"
echo "--- /etc/rancher/k3s/config.yaml keys ---"
if [ -f /etc/rancher/k3s/config.yaml ]; then
  sudo grep -E "^[a-zA-Z0-9_-]+:" /etc/rancher/k3s/config.yaml | grep -viE "token|password|secret|key:"
else
  echo "config.yaml MISS"
fi
echo "--- snapshot.yaml keys ---"
if [ -f /etc/rancher/k3s/snapshot.yaml ]; then
  sudo grep -E "^[a-zA-Z0-9_-]+:" /etc/rancher/k3s/snapshot.yaml | grep -viE "token|password|secret"
else
  echo "snapshot.yaml MISS"
fi
'

echo
echo "--- install scripts pin ---"
grep -n INSTALL_K3S_VERSION "$ROOT/k3s/install-server.sh" "$ROOT/k3s/join-agents.sh" 2>/dev/null || echo "INSTALL_K3S_VERSION MISS"

echo
echo "========== DONE 20-K3S =========="
echo "DISCOVER_OK layer=k3s no tokens"
