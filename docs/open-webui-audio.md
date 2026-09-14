# Open WebUI — Whisper + Piper

Full context: [LESSONS.md](LESSONS.md).

**Admin (server)** — `https://chat.lan/admin/settings` → Audio

| Field | Value |
|---|---|
| STT Engine | Whisper (Local) |
| STT Model | `base` |
| TTS Engine | OpenAI |
| API Base URL | `http://piper.apps.svc.cluster.local:8000/v1` |
| API Key | `sk-local` |
| TTS Voice | `alloy` |
| TTS Model | `tts-1` |

The user-gear Audio page only offers Default / Web API / Kokoro.js. That is **not** Piper.

**TTS test:** assistant-message speaker icon (not the input waveform).

**Call/mic:** HTTPS + trusted mkcert CA. Toast “Permission denied when accessing media devices” = getUserMedia blocked.
