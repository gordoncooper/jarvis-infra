# JARVIS Phase 10 — Piper TTS  UP 2026-09-08

See [docs/LESSONS.md](docs/LESSONS.md) and [docs/open-webui-audio.md](docs/open-webui-audio.md).

## What is running

- `ghcr.io/matatonic/openedai-speech-min:latest` on **apps-01**
- Voices: `data-?` no — hostPath **apps-01** `/cluster/local/piper`
- OpenAI-compatible `/v1/models` → `tts-1`, `tts-1-hd`
- Open WebUI env + Admin Audio both point at `http://piper.apps.svc.cluster.local:8000/v1`

## Failure we hit

Passing `args: ["--xtts_device","none",…]` **replaced** image CMD `startup.sh` → CrashLoop.
Fixed by deleting `command`/`args`. Probe is **tcpSocket**, not wget (not in the image).

## Verify

```bash
kubectl -n apps get pods -l app=piper
kubectl -n apps port-forward svc/piper 8000:8000
# other terminal:
curl -sS http://127.0.0.1:8000/v1/models
```
