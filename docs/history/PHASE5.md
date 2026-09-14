# JARVIS Phase 5 — LiteLLM  COMPLETE 2026-08-30

`http://llm.lan/v1`  (master key `~/.litellm-master.key` on bastion)

| Alias | Backend | Test |
|---|---|---|
| `jarvis-local` | Ollama Q6 gpu-01 | worked |
| `jarvis-grok` | xAI API `grok-4-fast` | `"grok-ok"` |
| `jarvis-grok-code` | xAI `grok-code-fast-1` | not smoked |

Secret `inference/litellm` is **not** in git. Key files on bastion:
`~/.litellm-master.key`, `~/.xai-api.key` (mode 600).

Default for Goose = **jarvis-local**. SuperGrok chat quota is unused.
Hard $ cap still needs Postgres spend DB (later). rpm/tpm on Grok aliases for now.
