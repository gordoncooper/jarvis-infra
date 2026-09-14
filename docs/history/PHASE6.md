# JARVIS Phase 6 — Open WebUI + Goose  COMPLETE 2026-08-30

Chat: http://chat.lan  (`jarvis-local` = Ollama `jarvis` Q6, $0).

Goose 1.48.0 on bastion — see `examples/goose/`.

- `OPENAI_HOST: http://llm.lan` (NOT `.../v1`)
- Key in `~/.config/goose/secrets.yaml` + `export OPENAI_API_KEY`
- Agent model **`jarvis-grok-code`**. `jarvis-local` hallucinates shell (fake EPYC).
- Needs `bzip2` to unpack. Developer builtin extension on.
- Shell runs on the **bastion** (Celeron N5105). Cluster: `ssh` / `kubectl`.
- Trust only `▸ shell` output. No unattended `kubectl apply`.

## Lessons

- Rewrite kustomize `resources:` (don't `printf -- '- apps'`).
- Duplicate `env` keys → Flux SSA dry-run fails.
- `ENABLE_NATIVE_FUNCTION_CALLING=false` prompt-injects tools.
- `ollama create NAME -f Modelfile`
- `kubectl exec -i` for heredoc
- `ENABLE_PERSISTENT_CONFIG=false` ignores SQLite capability patches
