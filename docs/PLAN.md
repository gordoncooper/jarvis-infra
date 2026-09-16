# JARVIS north star (locked)

Git tag and image tag are independent. Pins live in `VERSION`.

## Product

**chat.lan is the glass.** Tony does not open a second panel to *do* things.

- Talk / RAG / voice: LiteLLM alias `jarvis` (7B + grok / grok-code).
- **Do** (real exec): LiteLLM `jarvis-hands` → OpenClaw agent CLI via in-pod OpenAI shim.
- Break-glass only: http://agent.lan:18789 and `./scripts/openclaw-ask.sh`.
- Goose: operator on the bastion only. Never nested.
- gpu-02: embed-only.
- No inbox/drain. No chat.lan kubectl as the 7B. No spend cap. No Qwen swap unless we reopen.

## Status

- Router `jarvis`, ROUTED chip, picker escape hatch, embed/arena hidden, native FC off.
- Voice: Piper GB male (`alloy`).
- Memory: `learned.md` + lab-docs; seed-learned idempotent (duplicate content = success).
- Telemetry: intent-gated LIVE only.
- Hands v1 CLI/UI: proven (6 Ready). **Not** the everyday door.
- Hands v2 in-glass: **`jarvis-hands` read-only** (this step). OpenClaw ClusterRole stays `openclaw-readonly`.

## Remaining (locked order)

1. **Now — `jarvis-hands` read-only:** sidecar OpenAI shim in the OpenClaw pod; LiteLLM model; OWUI filter list; router sends *inspect-with-shell* (get/describe/logs/Ready) to `jarvis-hands`. Do **not** widen RBAC. apply/delete/restart still *talk* via grok-code until step 2.
2. **Later — OpenClaw can do anything:** widen ClusterRole + OpenClaw approvals. Same shim. Router may send mutate verbs to `jarvis-hands`. Not this PR.
3. **Later — wake-word / always-on listen.**
4. **Later — Tailscale / off-LAN.**

Parked: inbox.md, WS-from-OWUI-filter, nested Goose, daily Grok cap, replacing Open WebUI.
