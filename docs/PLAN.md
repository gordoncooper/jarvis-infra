# PLAN.md — superseded

This file was the product spec. Its central claim — "chat.lan is the glass" —
was reversed on 2026-09-19 by **D-0002**: jarvis.lan is the product surface and
chat.lan is break-glass. Two docs asserting opposite products is the single
biggest reason this project drifted, so the loser does not stay in circulation.

| You wanted | Now in |
| --- | --- |
| Product intent and principles | [`VISION.md`](VISION.md) |
| What was decided and when | [`DECISIONS.md`](DECISIONS.md) |
| Engineering tickets | [`BACKLOG.md`](BACKLOG.md) |
| Footguns | [`LESSONS.md`](LESSONS.md) |

Content deliberately carried forward into `VISION.md`: one source per fact; no
regex on English; local-first with cloud on demand; the conversational model
gets no tools; prefer the vendor knob; `openclaw-recycle` is not widened without
Gordon naming the verbs.

Content deliberately dropped: the current-state router description (it described
LiteLLM's configuration at a moment in time, which is the cluster's job to
answer), the five classifier acceptance pings (now a BACKLOG ticket), and the
freeze/canary notes (operational state, not spec).
