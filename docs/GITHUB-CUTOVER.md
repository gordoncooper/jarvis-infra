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
