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
| **jarvis.lan** | The product. Conversation, briefings, life, doing things. | Look like a NOC. Show a model picker. |
| **noc.lan** | Operator truth. Nodes, services, logs, alerts, GPU. | Require the brain to be healthy to render. |
| chat.lan, agent.lan, llm.lan, git.lan, grafana.lan | Break-glass and vendor UIs. | Get themed, or grow features. |

The independence rule is load-bearing: `noc.lan` needs its own deployment,
ingress, and telemetry path, so that when the brain, LiteLLM, or Ollama are
down it still renders — degraded, honest, and readable. If the k3s API itself
is gone, bastion SSH is the last glass. Say so; do not pretend otherwise.

## Capability model

Inherited from `jarvis-core/policy.yaml`, which got this part right. Capability
is a list of **verbs**, declared in one place, each with a class:

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

These are open. They are the planning agenda, not settled design — see D-0003.
Do not let an AI session quietly answer one of these in passing; each deserves a
decision entry.

1. **Agent runtime.** What actually executes verbs? OpenClaw as today, a
   different framework, or something written here? This is the biggest open
   question and the one that has churned most.
2. **Orchestrator.** Where do routing, confirmations, the audit log, and session
   state live? Today they are smeared across LiteLLM config, OWUI sqlite
   filters, and an unimplemented `policy.yaml`.
3. **Which model does what**, and who decides. Classifier, talker, coder, hands.
4. **Memory.** What JARVIS remembers, where it is written, what is never written,
   and how it is recalled without a RAG pile.
5. **Voice.** Wake word, STT, TTS — which parts are cluster units and which are
   laptop transport.
6. **Off-LAN.** If the glass is ever reachable from outside, auth stops being
   optional and this becomes a security design, not a convenience feature.

## Non-goals

- Replacing the rack, k3s, Flux, or Gitea. They work.
- Home automation, cameras, or spending money. Not named, therefore refused.
- A second chat GPU on gpu-02 while it is the embedding node.
- Theming break-glass surfaces.
- A framework migration for its own sake. The previous two attempts died of
  churn, not of missing features.
