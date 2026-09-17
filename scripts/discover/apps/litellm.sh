#!/bin/bash
# App probe — LiteLLM. Model aliases + router flags. Strip api_key / tokens.
set -euo pipefail
if [ "$(whoami)" != agent ]; then echo FATAL: run as agent >&2; exit 1; fi

printf '\n========== APP litellm ==========\n'
date -Is

echo
echo "--- deploy ---"
kubectl -n inference get deploy litellm -o json | python3 -c '
import json,sys
d=json.load(sys.stdin)
spec=d["spec"]["template"]["spec"]
c=spec["containers"][0]
print("image", c.get("image"))
print("policy", c.get("imagePullPolicy"))
print("sa", spec.get("serviceAccountName"))
print("nodesel", spec.get("nodeSelector"))
print("env", sorted(e.get("name") for e in (c.get("env") or [])))
'
kubectl -n inference get pod -l app=litellm -o wide --no-headers

echo
echo "--- ConfigMap model_list + router (redacted) ---"
kubectl -n inference get cm -o json | python3 -c '
import json,sys,re
d=json.load(sys.stdin)
cms=[it for it in d.get("items",[]) if "litellm" in it["metadata"]["name"].lower()]
print("cms", [it["metadata"]["name"] for it in cms])
text=""
for it in cms:
    data=it.get("data") or {}
    for k,v in data.items():
        if "key" in k.lower() or "token" in k.lower():
            print("skip_data_key", k)
            continue
        if v and ("model_list" in v or "model_name" in v):
            text=v
            print("using", it["metadata"]["name"]+"/"+k, "bytes", len(v))
            break
if not text:
    print("NO_CONFIG")
    raise SystemExit(0)
red=re.sub(r"(api_key\s*:\s*)\S+", r"\1REDACTED", text)
print("--- model_name lines ---")
for line in red.splitlines():
    if "model_name:" in line or line.strip().startswith("model:") or "rpm:" in line or "tpm:" in line:
        print(line.rstrip())
print("--- router flags ---")
for key in ("return_raw_model_name","session_affinity","default_model","classifier_type","auto_router","complexity_router"):
    if key in red:
        print("HAS", key)
print("--- keyword_tier_rules count ---")
print("keyword_tier_rules", red.count("keyword_tier_rules"))
'

echo
echo "--- /v1/models ids ---"
python3 - << 'PY'
import json, urllib.request
url = "http://llm.lan/v1/models"
try:
    with urllib.request.urlopen(url, timeout=8) as r:
        d = json.loads(r.read().decode())
        ids = [x.get("id") for x in d.get("data") or []]
        print("count", len(ids))
        for i in ids:
            print(i)
except Exception as e:
    print("FAIL", url, type(e).__name__)
    try:
        with urllib.request.urlopen("http://10.43.0.1/", timeout=2):
            pass
    except Exception:
        pass
PY
# clusterIP fallback
python3 - << 'PY'
import json, urllib.request, subprocess
ip = subprocess.check_output(["kubectl","-n","inference","get","svc","litellm","-o","jsonpath={.spec.clusterIP}"], text=True).strip()
url = f"http://{ip}:4000/v1/models"
try:
    with urllib.request.urlopen(url, timeout=8) as r:
        d = json.loads(r.read().decode())
        ids = [x.get("id") for x in d.get("data") or []]
        print("svc", url, "count", len(ids))
        for i in ids:
            print(i)
except Exception as e:
    print("svc FAIL", type(e).__name__)
PY

echo
echo "========== DONE APP litellm =========="
echo "DISCOVER_OK app=litellm no keys"
