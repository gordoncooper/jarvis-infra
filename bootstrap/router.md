# GL-BE9300 — click-ops (no Ansible)

LAN CIDR **192.168.8.0/24**, router **192.168.8.1**.
DHCP pool **192.168.8.100–249** (nodes sit **outside** the pool).

| Name | IP | Notes |
|---|---|---|
| bastion | 192.168.8.10 | on TL-SG108E (1G) |
| ctrl-01 | 192.168.8.11 | TL-SG108S-M2 (2.5G) |
| gpu-01 | 192.168.8.12 | 2.5G |
| gpu-02 | 192.168.8.13 | 2.5G |
| data-01 | 192.168.8.14 | 2.5G, NFS |
| data-02 | 192.168.8.15 | 2.5G |
| apps-01 | 192.168.8.16 | 2.5G; also **agent.lan** |

DNS A records (and `/etc/hosts` from Ansible `cluster_hosts`):

| Name | IP |
|---|---|
| git.lan jarvis.lan noc.lan grafana.lan llm.lan chat.lan home.lan | **192.168.8.11** (Traefik) |
| agent.lan | **192.168.8.16** (OpenClaw hostPort 18789) |

Uplink: SG108S-M2 → SG108E → BE9300. Do not put `agent.lan` on .11.
