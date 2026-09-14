# JARVIS Phase 4 — NVIDIA + Ollama  COMPLETE 2026-08-30

| Item | Value |
|---|---|
| Device plugin | Running on gpu-01, `nvidia.com/gpu: 1` |
| Ollama | inference/ollama, RuntimeClass `nvidia`, NFS `/mnt/nfs/models/ollama` |
| Model | **qwen2.5:7b-instruct-q6_K** (6.3 GB) |
| VRAM | ~5999 / 8188 MiB |
| Speed | ~27 tok/s |
| Do not | second model, 14B, Q8 |

`ollama run` via `kubectl exec -i` looks hung (REPL). Use port-forward + `/api/generate`.
Ollama image has no `curl`.
