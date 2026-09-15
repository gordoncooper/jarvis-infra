# Publish to GitHub (gordoncooper) — Gitea stays origin

> **Not the current runbook.** Pins: [`VERSION`](../VERSION).
> Procedure: [REBUILD.md](REBUILD.md). Living mirror:
> `scripts/mirror-to-github.sh`.
>
> Do **not** retag v0.1–v0.4.12. Do **not** run old `git tag -a v0.1` blocks.

Repos are **private**. `gh repo create` already happened.

Day to day:

```bash
cd ~/cluster
git push
~/jarvis-infra/scripts/mirror-to-github.sh
```

Tag a new snapshot only after `check-contract.sh` and `verify-jarvis.sh` are OK.
Tag the **same** `GIT_TAG` from `VERSION` on both repos. Never move an old tag.
