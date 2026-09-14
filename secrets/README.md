# Secrets (SOPS + age)

Nothing in this directory is applied by Flux. Bastion only.

## One-time: age key

```bash
sudo apt-get install -y age
curl -fsSL -o /tmp/sops https://github.com/getsops/sops/releases/download/v3.10.2/sops-v3.10.2.linux.amd64
sudo install -m 755 /tmp/sops /usr/local/bin/sops
mkdir -p ~/.config/sops/age
age-keygen -o ~/.config/sops/age/keys.txt
chmod 600 ~/.config/sops/age/keys.txt
grep public ~/.config/sops/age/keys.txt
```

Copy the **private** `keys.txt` to a USB. Never GitHub.

`.sops.yaml` in the repo root lists that public key. Encrypt:

```bash
cp secrets/secrets.example.yaml secrets/secrets.yaml
# edit plaintext values
sops --encrypt --age <PUBLIC_KEY> secrets/secrets.yaml > secrets/secrets.sops.yaml
rm secrets/secrets.yaml
git add secrets/secrets.sops.yaml .sops.yaml
```

Decrypt on rebuild:

```bash
sops --decrypt secrets/secrets.sops.yaml > /tmp/jarvis-secrets.yaml
chmod 600 /tmp/jarvis-secrets.yaml
./bootstrap/apply-secrets.sh /tmp/jarvis-secrets.yaml
shred -u /tmp/jarvis-secrets.yaml
```

Until the first `secrets.sops.yaml` exists, `apply-secrets.sh` also reads
the bastion files `~/.litellm-master.key`, `~/.grafana-admin`, etc.
