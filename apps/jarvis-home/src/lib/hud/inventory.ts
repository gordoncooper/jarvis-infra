export const K3S_VERSION = "v1.36.4+k3s1";

export type NodeRole =
  | "control"
  | "gpu-chat"
  | "gpu-embed"
  | "storage-primary"
  | "storage-replica"
  | "apps"
  | "bastion";

export type InvNode = {
  id: string;
  host: string;
  ip: string;
  role: NodeRole;
  labels: string[];
  cpu: string;
  cores: number;
  ramGiB: number;
  disk: string;
  extra: string;
  kernel: string;
  k3s: string;
};

export const NODES: InvNode[] = [
  {
    id: "ctrl-01",
    host: "ctrl-01.lan",
    ip: "192.168.8.11",
    role: "control",
    labels: ["jarvis.role=control", "control-plane", "etcd"],
    cpu: "i7-8700T",
    cores: 12,
    ramGiB: 32,
    disk: "160G root",
    extra: "k3s server · Gitea · Flux · Traefik",
    kernel: "7.0.0-30-generic",
    k3s: K3S_VERSION,
  },
  {
    id: "gpu-01",
    host: "gpu-01.lan",
    ip: "192.168.8.12",
    role: "gpu-chat",
    labels: ["jarvis.role=gpu", "jarvis.gpu=chat"],
    cpu: "i7-8700T",
    cores: 12,
    ramGiB: 32,
    disk: "160G root",
    extra: "RTX A1000 8GiB · Ollama qwen2.5 7B Q6",
    kernel: "7.0.0-30-generic",
    k3s: K3S_VERSION,
  },
  {
    id: "gpu-02",
    host: "gpu-02.lan",
    ip: "192.168.8.13",
    role: "gpu-embed",
    labels: ["jarvis.role=gpu", "jarvis.gpu=perception"],
    cpu: "i7-8700T",
    cores: 12,
    ramGiB: 32,
    disk: "160G root",
    extra: "RTX A1000 8GiB · nomic-embed-text",
    kernel: "7.0.0-31-generic",
    k3s: K3S_VERSION,
  },
  {
    id: "data-01",
    host: "data-01.lan",
    ip: "192.168.8.14",
    role: "storage-primary",
    labels: ["jarvis.role=storage", "jarvis.storage=primary"],
    cpu: "i7-8700T",
    cores: 12,
    ramGiB: 32,
    disk: "P300 512G → /cluster",
    extra: "NFS export · etcd snapshots · backups",
    kernel: "7.0.0-30-generic",
    k3s: K3S_VERSION,
  },
  {
    id: "data-02",
    host: "data-02.lan",
    ip: "192.168.8.15",
    role: "storage-replica",
    labels: ["jarvis.role=storage", "jarvis.storage=replica"],
    cpu: "i7-8700T",
    cores: 12,
    ramGiB: 32,
    disk: "P300 512G → /cluster",
    extra: "Prometheus · Grafana · kube-state-metrics",
    kernel: "7.0.0-30-generic",
    k3s: K3S_VERSION,
  },
  {
    id: "apps-01",
    host: "apps-01.lan",
    ip: "192.168.8.16",
    role: "apps",
    labels: ["jarvis.role=apps"],
    cpu: "i7-8700T",
    cores: 12,
    ramGiB: 32,
    disk: "P300 512G → /cluster",
    extra: "Open WebUI · LiteLLM · Piper · OpenClaw · homepage",
    kernel: "7.0.0-30-generic",
    k3s: K3S_VERSION,
  },
  {
    id: "bastion",
    host: "bastion.lan",
    ip: "192.168.8.10",
    role: "bastion",
    labels: ["jump"],
    cpu: "Celeron N5105",
    cores: 4,
    ramGiB: 7,
    disk: "40G root",
    extra: "Ansible · kubectl · Goose · mkcert",
    kernel: "7.0.0-30-generic",
    k3s: "—",
  },
];

export const SERVICES = [
  { id: "chat", name: "Chat", href: "https://chat.lan", note: "Open WebUI · Whisper STT · Piper TTS", host: "apps-01", tls: true, ns: "apps", workload: "open-webui" },
  { id: "agent", name: "Agent", href: "http://agent.lan:18789", note: "OpenClaw gateway · hostPort 18789", host: "apps-01", tls: false, ns: "agents", workload: "openclaw" },
  { id: "grafana", name: "Grafana", href: "https://grafana.lan", note: "NVIDIA 14574 · node exporters", host: "data-02", tls: true, ns: "monitoring", workload: "grafana" },
  { id: "git", name: "Gitea", href: "http://git.lan", note: "Flux origin · stays HTTP", host: "ctrl-01", tls: false, ns: "gitea", workload: "gitea" },
  { id: "llm", name: "LiteLLM", href: "https://llm.lan/v1", note: "jarvis-local · grok · grok-code", host: "apps-01", tls: true, ns: "inference", workload: "litellm" },
];

export const WORKLOADS = [
  { ns: "inference", name: "ollama", node: "gpu-01", ready: "1/1" },
  { ns: "inference", name: "ollama-embed", node: "gpu-02", ready: "1/1" },
  { ns: "inference", name: "litellm", node: "apps-01", ready: "1/1" },
  { ns: "apps", name: "open-webui", node: "apps-01", ready: "1/1" },
  { ns: "apps", name: "piper", node: "apps-01", ready: "1/1" },
  { ns: "agents", name: "openclaw", node: "apps-01", ready: "1/1" },
  { ns: "gitea", name: "gitea", node: "ctrl-01", ready: "1/1" },
  { ns: "flux-system", name: "kustomize-controller", node: "ctrl-01", ready: "1/1" },
  { ns: "monitoring", name: "prometheus", node: "data-02", ready: "1/1" },
  { ns: "monitoring", name: "grafana", node: "data-02", ready: "1/1" },
  { ns: "kube-system", name: "traefik", node: "ctrl-01", ready: "1/1" },
];

export const ROLE_LABEL: Record<string, string> = {
  control: "CONTROL",
  "gpu-chat": "GPU / CHAT",
  "gpu-embed": "GPU / EMBED",
  "storage-primary": "NFS PRIMARY",
  "storage-replica": "METRICS",
  apps: "APPS",
  bastion: "BASTION",
};

export const GPU_UUID = {
  "gpu-01": "GPU-e8a5b185-1cc6-fded-c5ba-6e759b6f089f",
  "gpu-02": "GPU-7a9531af-c188-5b0a-7208-e9bd3ba392b2",
};
