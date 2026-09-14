# JARVIS Phase 8 — gpu-02 perception (embed + RAG)  COMPLETE 2026-09-03

gpu-02 `192.168.8.13` labels `jarvis.role=gpu` `jarvis.gpu=perception`
Driver 595.71.05 + toolkit + device plugin, `nvidia.com/gpu=1`.

## What runs where

| Workload | Node | Notes |
|---|---|---|
| Ollama chat `jarvis` (7B Q6) | gpu-01 | ~6000 MiB VRAM, KEEP_ALIVE=-1 |
| Ollama embed `nomic-embed-text` | gpu-02 | 768-d, ~407 MiB when loaded |
| LiteLLM `jarvis-embed` | apps-01 | `ollama/nomic-embed-text` → ollama-embed |
| Open WebUI Knowledge | apps-01 | `RAG_EMBEDDING_ENGINE=ollama` |

Model store on gpu-02: `/mnt/nfs/models/ollama-embed` (not the chat store).

## Smoke that worked

```bash
kubectl -n inference get pods -o wide
# ollama-embed on gpu-02, ollama on gpu-01, litellm on apps-01

kubectl -n inference port-forward svc/ollama-embed 11435:11434
curl -sS http://127.0.0.1:11435/api/embeddings \
  -H 'Content-Type: application/json' \
  -d '{"model":"nomic-embed-text","prompt":"JARVIS cluster smoke test"}'
# dims 768
# this Ollama build has NO `ollama embed` CLI — HTTP only
```

## How to use Knowledge in Open WebUI v0.11.3

Workspace → Models is **custom presets**, not chat models. Chat models are the picker (`jarvis-local`).

1. **Workspace → Knowledge → Create**  
   Name `lab-docs`. Create Knowledge.
2. On that collection page, **+** (right of Search Collection) → upload a `.txt`.
3. **New Chat**, model **jarvis-local**.
4. Input **+** → **Attach Knowledge** → check `lab-docs`.  
   Chip `lab-docs` / Collection appears on the user bubble.
5. Ask something only the file contains.

Verified: file said `blue-banana-42`; reply was “Retrieved 1 source” + that phrase + citation `lab-docs.txt`.

`#lab-docs` in the box is the same attach.

Pin on every chat: Admin → Settings → Models → jarvis-local → Knowledge → lab-docs.

## Do not

- Second 7B on gpu-02
- `ollama embed` CLI (does not exist here)
- Community “Discover a model”
