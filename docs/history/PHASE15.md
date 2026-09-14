# JARVIS Phase 15 — OpenClaw Prometheus  UP 2026-09-08 20:37

`prom.js nvidia_smi_temperature_gpu` → gpu-01 69, gpu-02 61.

Pairing: list is empty until you open **http://agent.lan:18789** and
submit the gateway token. Then:

```
kubectl -n agents exec deploy/openclaw -- openclaw devices list
kubectl -n agents exec deploy/openclaw -- openclaw devices approve <id>
```

New session: "What is GPU temperature on gpu-01 and gpu-02?"
Must use cluster-metrics / prom.js, not invent numbers.
