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

1. **DONE — glass freeze (v0.4.30).** chat.lan alias `jarvis`. SIMPLE = talk/inventory (7B). COMPLEX = inspect (`are nodes ready/up`, `get pods`, `kubectl get`) → `jarvis-hands` (OpenClaw readonly). REASONING = YAML/Flux → grok-code. Do **not** retune SYSTEM, LIVE_RE, HUD CSS, or keyword_tier_rules unless chat.lan regresses.
2. **Later — OpenClaw writes:** widen ClusterRole + approvals. Same shim. Not this tag.
3. **Wake-word v1 (laptop).** Stock **hey_jarvis** via `scripts/jarvis-wake.py` on Tony's laptop → pinned **Voice** chat. Not k3s. Headphones. Room Pi parked.
4. **Later — Tailscale / off-LAN.**

Parked: inbox.md, nested Goose, daily Grok cap, replacing Open WebUI, Qwen swap.

## Freeze (do not break)

- Pins: `VERSION` only. Image still `docker.io/library/jarvis-home:v0.4.9`.
- OpenClaw `agents.defaults.timeoutSeconds` 180. Shim ASK_TIMEOUT 180. LiteLLM hands timeout 240.
- Canary **blue-banana-42** (briefing). silver-orbit-3 is learned.md, not the secret phrase.
- New chat after overlay/SYSTEM/filter changes. Keywords are matched literally (include “the”, “up”, “pods”).
