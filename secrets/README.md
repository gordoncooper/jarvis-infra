# Secrets (SOPS + age)

Nothing in this directory is applied by Flux. Bastion only.

`secrets.sops.yaml` **is in git** (encrypted). The age **private** key is not.

## Age key (once)

```bash
sudo apt-get install -y age
curl -fsSL -o /tmp/sops https://github.com/getsops/sops/releases/download/v3.10.2/sops-v3.10.2.linux.amd64
sudo install -m 755 /tmp/sops /usr/local/bin/sops
mkdir -p ~/.config/sops/age
age-keygen -o ~/.config/sops/age/keys.txt
chmod 600 ~/.config/sops/age/keys.txt
grep public ~/.config/sops/age/keys.txt
```

Copy `keys.txt` to a USB (mode 600). Never GitHub. Never leave it mode 664.

`.sops.yaml` in the repo root lists that public key.

## Rebuild (age key present)

```bash
./scripts/materialize-bastion-secrets.sh
./bootstrap/apply-secrets.sh
```

## Fallback (NFS still has bastion-secrets.tgz)

```bash
./scripts/restore-bastion-secrets.sh YYYYMMDD-HHMM
./bootstrap/apply-secrets.sh
```

Do not commit plaintext `secrets/secrets.yaml`.
