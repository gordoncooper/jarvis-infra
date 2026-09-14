# JARVIS changelog

## 2026-09-08 21:13  Phase 20 HTTPS UP

home.lan and grafana.lan on mkcert. git.lan stays HTTP.


Prom rules loaded. LiteLLM homepage ping green. ALERTS empty.


OpenClaw: 6 Ready, 37 pods, GPU temps/VRAM from k8s.js + prom.js.


OpenClaw reported gpu-01 69C / gpu-02 62C via prom.js. Re-pair after pod recycle.


http://home.lan 200. subPath + emptyDir logs. Never mount ConfigMap on `/app/config`.


- GPU exporter field list includes `index`. Grafana 14574 vars use `nvidia_smi_gpu_info`.
- Phase 13: Homepage at home.lan.

## 2026-09-08 19:20  Pause — docs from live failures

- [docs/LESSONS.md](docs/LESSONS.md) is the override list.
- Phase 10: no `args` on openedai-speech-min; Admin Audio URL not user overlay; TTS = reply speaker.
- Phase 9: `agent.lan` **.16:18789**; hosts file was still .11; OpenClaw read-only SA.
- Phase 11: kube-state-metrics **v2.20.0**; never b64 manifests in chat.
- Fixed workspace `open-webui.yaml` (RAG_EMBEDDING_ENGINE was on one broken line).

## 2026-09-08  Phase 10–11

Piper TTS + Grafana/Prometheus.

## 2026-09-04  Phase 9 OpenClaw

## 2026-09-03  Phase 8 RAG / gpu-02

## 2026-08-30  Phases 1–6
