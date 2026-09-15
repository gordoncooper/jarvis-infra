# Publish to GitHub (gordoncooper) — Gitea stays origin

Repos are **private**. Tag this snapshot **`v0.1`** on both repos before
you treat GitHub as a backup.

On a machine with `gh` logged in as **gordoncooper**:

```bash
gh repo create gordoncooper/jarvis-cluster --private --disable-wiki
gh repo create gordoncooper/jarvis-infra   --private --disable-wiki
```

## 1. Tag Gitea, then mirror (jarvis-cluster)

Do the tag **on Gitea first**. `--mirror` copies tags; tagging only on
GitHub would drift.

```bash
# bastion, working clone
cd ~/cluster
git fetch origin
git checkout main
git log -1 --oneline    # expect 5fb0f6e  tls: HTTPS home.lan ...
git tag -a v0.1 -m "v0.1 — first GitHub mirror (TLS + homepage + monitoring)"
git push origin v0.1

# mirror including the tag
git clone --mirror http://git.lan/jarvis/cluster.git ~/.jarvis-mirror/cluster.git
cd ~/.jarvis-mirror/cluster.git
git remote add github git@github.com:gordoncooper/jarvis-cluster.git
git push --mirror github

git ls-remote --tags git@github.com:gordoncooper/jarvis-cluster.git
# expect  refs/tags/v0.1
```

Later: `~/jarvis-infra/scripts/mirror-to-github.sh` (pushes tags too).

## 2. jarvis-infra + tag v0.1

```bash
cd ~/jarvis-infra
git init
git add .
git status              # no .pem, no secrets.yaml
git commit -m "infra: Ansible, k3s bootstrap, rebuild runbook, PHASE history"
git branch -M main
git tag -a v0.1 -m "v0.1 — first GitHub publish (rebuild kit)"
git remote add origin git@github.com:gordoncooper/jarvis-infra.git
git push -u origin main
git push origin v0.1

git ls-remote --tags origin
# expect  refs/tags/v0.1
```

Do **not** `git push --mirror` infra from Gitea. Different repos.

## After v0.1

1. `age-keygen` + first `secrets.sops.yaml` (tag that **v0.2**)
2. Nightly `scripts/mirror-to-github.sh`
3. Flux still uses `http://git.lan/jarvis/cluster.git`

Bump tags as **v0.2, v0.3, …** on a known-good HEAD. Do not retag `v0.1`.

## v0.4.4 — command center live (2026-09-14)

GitHub `jarvis-cluster` already has **v0.1, v0.3, v0.4, v0.4.1, v0.4.2, v0.4.3**.
Do **not** retag any of those. Next snapshot is **v0.4.4**.
(v0.2 was infra-only: SOPS.)

home.lan **200**, /status **200**. Image `jarvis-home:v0.2` on apps-01.
Gitea homepage YAML is `021d7a3`. Infra git must contain `apps/jarvis-home/output/`.

```bash
# --- cluster (Gitea is origin) ---
cd ~/cluster
git fetch origin && git checkout main
git log -1 --oneline    # expect 021d7a3 (v0.2 image; GitHub may still show fb4fd17)
git tag -a v0.4.4 -m "v0.4.4 — command center live (home 200 / status 200)"
git push origin v0.4.4
~/jarvis-infra/scripts/mirror-to-github.sh
git ls-remote --tags git@github.com:gordoncooper/jarvis-cluster.git | grep v0.4.4

# --- infra ---
cd ~/jarvis-infra
git add -A
git status   # must list apps/jarvis-home/output  and Dockerfile
git commit -m "infra: jarvis-home v0.2 bundle + rebuild contract (Home + Status)"
git tag -a v0.4.4 -m "v0.4.4 — command center live (home 200 / status 200)"
git push origin main
git push origin v0.4.4
```
