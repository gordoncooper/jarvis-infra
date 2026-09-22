# Open WebUI — Knowledge (`lab-docs`)

Source of truth: [`briefing.md`](briefing.md) in git.
Publish: `~/jarvis-infra/scripts/seed-lab-docs.sh` (JWT from the WebUI secret; no browser).

The `jarvis-local` model record is told to use collection **lab-docs**.
If a chat has no knowledge chip: **+** → Attach Knowledge → `lab-docs`, or type `#`.

Embeddings: gpu-02 `nomic-embed-text`. Generation: gpu-01 `jarvis`.

Do not upload secrets. Keep the canary line in briefing.md (`blue-banana-42`).

## jarvis-learned

Operator-written break-glass facts from `learned.md` (not git). Publish:
`scripts/seed-learned.sh`. Append + publish: `scripts/remember.sh <fact>`.

Not to be confused with JARVIS's **promoted memory**, which is a jarvis.lan
capability in sqlite — confirm-gated, listable, forgettable (D-0013, D-0035).
chat.lan does not write memory at all (D-0039). This file is a knowledge base
you fill deliberately, from the bastion.
Attach both **lab-docs** and **jarvis-learned** if a chat has no chips.
