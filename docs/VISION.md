# JARVIS — what we are building

Intent, not status. Nothing here describes what is deployed; the cluster answers
that. When this document and a dated entry in [`DECISIONS.md`](DECISIONS.md)
disagree, the decision wins.

## The goal

A house that is aware of its own hardware, services, files, and state, that
Gordon talks to in plain language, and that can act on what it knows. An
Iron Man JARVIS with real hands on a real rack — not a chatbot with a rack
theme, and not a dashboard with a chat box bolted on.

Three properties matter more than any feature:

1. **It knows what is true.** Answers come from the live cluster, never from a
   model's memory of a doc. A JARVIS that invents a GPU number is worse than one
   that says it does not know.
2. **It acts, with a leash.** Every capability is a named verb with a blast
   radius and a trust class. Nothing is "the AI decided to".
3. **It stays up when it is sick.** The surface that tells you the house is
   broken must not depend on the parts that are broken.

## Surfaces

Per D-0002.

| Surface | Job | Must never |
| --- | --- | --- |
| **jarvis.lan** | The product four-display cockpit (D-0031 / D-0032). | Show a model picker. Scrape noc.lan / Prometheus from glass. |
| **noc.lan** | Independent operator truth / break-glass telemetry. | Require the brain to be healthy to render. |
| home.lan | Older command board until retired. | Be themed as the product chrome. |
| chat.lan, agent.lan, llm.lan, git.lan, grafana.lan | Break-glass and vendor UIs. | Get themed, or grow features. |

jarvis.lan is the four-display cockpit (login, earth, briefing/channel, rack NOC).
The NOC display is a view of orchestrator pulse, not a second product.
A standalone noc.lan / home.lan may still exist so telemetry stays up
when the talker is down. Do not merge those hosts into the glass bundle.

The independence rule is load-bearing: `noc.lan` needs its own deployment,
ingress, and telemetry path, so that when the brain, LiteLLM, or Ollama are
down it still renders — degraded, honest, and readable. If the k3s API itself
is gone, bastion SSH is the last glass. Say so; do not pretend otherwise.
Glass on jarvis.lan still must not scrape noc.lan (D-0012); pulse goes through
the orchestrator.

## Capability model

Inherited from the second attempt's `policy.yaml`, which got this part right
and is the one idea carried forward from it (D-0003, D-0038). Capability is a
list of **verbs**, declared in one place, each with a class:

| Class | Meaning |
| --- | --- |
| `trusted` | Run it, then log it. Reads and narrow, reversible writes. |
| `confirm` | Ask first, through the glass, then run. Anything personal or wide. |
| `refuse` | Not named yet. The default for everything not on the list. |

Rules that follow from this, and that we keep:

- A model does not invent verbs. If it is not declared, it is `refuse`.
- Every trusted verb has a proof command an operator can run by hand.
- The conversational model gets **no tools**. Tool use is a separate worker with
  its own identity and RBAC. The 7B fake-called tools; that is why this rule exists.
- Confirmations expire. A pending "yes" from this morning does not authorise a
  restart this afternoon.
- Widening a verb's blast radius is a decision, recorded, not a patch.

## Principles

Hard-won, mostly from [`LESSONS.md`](LESSONS.md):

- **One source per fact.** Persona, rack facts, memory, and live numbers each
  have exactly one home. Duplicating a fact guarantees two answers.
- **Intelligence in the router, not regex on English.** Classify with a model or
  a tool. Never pattern-match user phrasing into behaviour.
- **Local-first, cloud on demand.** The 7B for talk and RAG; a bigger brain when
  the job needs one. LAN-only until there is a deliberate decision to leave it.
- **Vendor knob before new code.** LiteLLM, OpenClaw, k8s RBAC already do most of
  it. One adapter per gap.
- **The rack is not the product.** Metal, k3s, Flux and the inference stack are
  plumbing that works. The rebuild is the brain and the glass.

## What the third attempt has to answer

Planning agenda for the rebuild (D-0003). Settled items point at a decision;
the rest stay open until Gordon confirms a dated entry. Do not quietly answer
an open item in passing.

1. **Agent runtime.** Partially settled: OpenClaw is break-glass + optional
   constrained actuator, not the product brain (D-0010). Still open: the exact
   hands runner shape when verbs land (shim to OpenClaw vs thin in-house).
2. **Orchestrator.** Settled for shape and impl home: separate Python service;
   themed TS→static glass in **`jarvis-app`**; Flux in `cluster`; `/v1` API with
   SSE; theme-swappable look (D-0012, D-0020). Product glass: four-display
   `cockpit` (D-0031 / D-0032); D-0017 first-cut scope superseded for chrome.
3. **Which model does what.** Settled for v1 product pins: talker + classifier
   `jarvis-local`; one cloud specialist `jarvis-grok`; orchestrator selects ids;
   no product auto-router; coder deferred; hands not product (D-0019 / D-0011).
4. **Memory.** Settled for v1 doctrine (D-0013). Confirm UI ships in glass
   (D-0032); Hands/memory confirms stay orchestrator-owned. Still open:
   schema pin, migrate-off `learned.md`, optional embed projection threshold.
5. **Voice.** Settled for v1: glass PTT first; laptop `hey jarvis` on the same
   orchestrator API; cluster Whisper SoT; Piper TTS (second voice allowed
   later); client-local UX commands; no room mic / custom wake (D-0014).
   Whisper shape: gpu-02, model `small`, OpenAI transcriptions request/response;
   orchestrator proxies audio to Whisper (D-0015 pins + D-0016 call path).
6. **Off-LAN.** Settled for v1: LAN-only product; no auth project until a
   deliberate off-LAN decision. Dynu / Tailscale noted as future options only
   (D-0018).

**Product glass (D-0031 / D-0032):** four-display cockpit on `jarvis.lan`
(Login, Earth, CMD, NOC); ConfirmCard on CMD + Earth toast; structured briefing
with `briefing_blurb` fallback; `/v1/pulse` via orchestrator. D-0017 six-point
done bar (persona, session, remember/forget, PTT, degraded) still stands.

## Non-goals

- Replacing the rack, k3s, Flux, or Gitea. They work.
- Home automation, cameras, or spending money. Not named, therefore refused.
- A second chat GPU on gpu-02 while it is the embedding node.
- Theming break-glass surfaces.
- A framework migration for its own sake. The previous two attempts died of
  churn, not of missing features.
