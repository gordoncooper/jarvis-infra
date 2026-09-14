# JARVIS Phase 7 — LAN HTTPS (mkcert)

Goal: `https://chat.lan` is a **trusted** origin so Chrome grants the mic
without `unsafely-treat-insecure-origin-as-secure` on every device.

You still install the **CA once per OS** (that is unavoidable for `.lan`).
It is not a Chrome flag and it covers git/llm/chat.

Flux stays on **http://git.lan** (no HTTP→HTTPS redirect there).

```bash
# bastion
bash ~/jarvis-cluster/scripts/lan-https.sh
# then git the TLSStore + Ingress TLS (no private keys in git)
```

CA: `~/.local/share/mkcert/rootCA.pem`
NFS: `/mnt/nfs/share/certs/jarvis-rootCA.pem`
