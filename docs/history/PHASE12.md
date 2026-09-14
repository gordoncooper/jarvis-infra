# JARVIS Phase 12 — GPU metrics  UP 2026-09-08 20:01

DaemonSet `nvidia-gpu-exporter` 1.2.1 on gpu-01/02. **No** `nvidia.com/gpu`.
`--query-field-names=index,uuid,name,...` (AUTO panics on driver 595 `[us]`).

Grafana 14574 variables (if Host is empty):

| var | query |
|---|---|
| job | `label_values(nvidia_smi_gpu_info, job)` |
| node | `label_values(nvidia_smi_gpu_info{job="$job"}, instance)` |

Refresh = On dashboard load. Save the dashboard.

Power/ECC N/A on RTX A1000 is the card.
