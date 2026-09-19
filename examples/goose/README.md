# Goose on the bastion

Chat (Open WebUI) uses **jarvis-local** ($0). Goose the agent must not: the 7B
invents shell output (fake EPYC). Two backend profiles ship here, both pinned to
a capable model.

| Profile | Backend | Model | Cost |
| --- | --- | --- | --- |
| `llm-lan` | LiteLLM at https://llm.lan | jarvis-grok-code | free (on-LAN) |
| `xai` | xAI API direct | grok-build-0.1 | metered, bills the xAI account |

```bash
./scripts/configure-goose.sh        # installs goose + both profiles + goose-backend
goose-backend                       # which profile is active
goose-backend xai                   # switch
goose-backend llm-lan               # switch back

cd ~/cluster
goose session   # banner MUST show the profile you expect
```

Keys are never in git. `llm-lan` reads `OPENAI_API_KEY` from `~/.litellm-master.key`;
`xai` reads `XAI_API_KEY` from `~/.xai-api.key`. Both are exported in `~/.bashrc`.
Do not export `GOOSE_MODEL` there -- an env var outranks the profile and would pin
both backends to one model.

Trust output only when you see `▸ shell` and it matches `kubectl`/`ssh` you'd run yourself.
Goose's cwd is the **bastion** (Celeron N5105). Cluster nodes: `ssh gpu-01` / `kubectl`.
Never unattended `kubectl apply` / `delete`.
