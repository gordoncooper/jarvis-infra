# Open WebUI — Knowledge (`lab-docs`)

Source of truth: [`briefing.md`](briefing.md) in git.
Publish: `~/jarvis-infra/scripts/seed-lab-docs.sh` (JWT from the WebUI secret; no browser).

The `jarvis-local` model record is told to use collection **lab-docs**.
If a chat has no knowledge chip: **+** → Attach Knowledge → `lab-docs`, or type `#`.

Embeddings: gpu-02 `nomic-embed-text`. Generation: gpu-01 `jarvis`.

Do not upload secrets. Keep the canary line in briefing.md (`blue-banana-42`).

## jarvis-learned

Promoted facts from `learned.md` (not git). Publish: `scripts/seed-learned.sh`.
Append + publish: `scripts/remember.sh <fact>`.
Attach both **lab-docs** and **jarvis-learned** if a chat has no chips.
