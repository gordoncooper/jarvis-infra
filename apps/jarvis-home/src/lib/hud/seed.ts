import {
  GPU_UUID,
  K3S_VERSION,
  NODES,
  SERVICES,
  WORKLOADS,
} from "./inventory";
import type { ClusterEvent, PodRow, Telemetry } from "./types";

const BOOT_MS = Date.parse("2026-09-03T16:00:00-07:00");

const SIM_PODS: Record<string, PodRow[]> = {
  "ctrl-01": [
    { ns: "gitea", name: "gitea-6d9cff854f-qhkwc", phase: "Running", ready: "1/1", restarts: 1 },
    { ns: "flux-system", name: "kustomize-controller-6d959d5f65-kj8hk", phase: "Running", ready: "1/1", restarts: 2 },
    { ns: "flux-system", name: "source-controller-645ff9f8b9-tlhg4", phase: "Running", ready: "1/1", restarts: 1 },
    { ns: "flux-system", name: "helm-controller-7c8d9f4b6-xk2n4", phase: "Running", ready: "1/1", restarts: 1 },
    { ns: "kube-system", name: "traefik-59b7647586-7g246", phase: "Running", ready: "1/1", restarts: 1 },
    { ns: "kube-system", name: "coredns-54996dc9b4-xtzgk", phase: "Running", ready: "1/1", restarts: 1 },
    { ns: "kube-system", name: "local-path-provisioner-77c8d6b4f-m2q9c", phase: "Running", ready: "1/1", restarts: 0 },
    { ns: "monitoring", name: "node-exporter-ctrl", phase: "Running", ready: "1/1", restarts: 0 },
  ],
  "gpu-01": [
    { ns: "inference", name: "ollama-5b95745686-j8blj", phase: "Running", ready: "1/1", restarts: 0 },
    { ns: "kube-system", name: "nvidia-device-plugin-9bjv9", phase: "Running", ready: "1/1", restarts: 0 },
    { ns: "monitoring", name: "nvidia-gpu-exporter-2qs8p", phase: "Running", ready: "1/1", restarts: 0 },
    { ns: "monitoring", name: "node-exporter-gpu01", phase: "Running", ready: "1/1", restarts: 0 },
  ],
  "gpu-02": [
    { ns: "inference", name: "ollama-embed-5cc579ccfb-p58px", phase: "Running", ready: "1/1", restarts: 0 },
    { ns: "kube-system", name: "nvidia-device-plugin-tx8zt", phase: "Running", ready: "1/1", restarts: 0 },
    { ns: "monitoring", name: "nvidia-gpu-exporter-8gl5v", phase: "Running", ready: "1/1", restarts: 0 },
    { ns: "monitoring", name: "node-exporter-gpu02", phase: "Running", ready: "1/1", restarts: 0 },
  ],
  "data-01": [
    { ns: "monitoring", name: "node-exporter-j47pv", phase: "Running", ready: "1/1", restarts: 0 },
  ],
  "data-02": [
    { ns: "monitoring", name: "prometheus-56cbcdc467-8tvrw", phase: "Running", ready: "1/1", restarts: 0 },
    { ns: "monitoring", name: "grafana-c587749b6-zk9nm", phase: "Running", ready: "1/1", restarts: 0 },
    { ns: "monitoring", name: "kube-state-metrics-f4b87d8d4-6nxwg", phase: "Running", ready: "1/1", restarts: 0 },
    { ns: "monitoring", name: "node-exporter-data02", phase: "Running", ready: "1/1", restarts: 0 },
  ],
  "apps-01": [
    { ns: "apps", name: "homepage-54ffb5d6d7-9t74f", phase: "Running", ready: "1/1", restarts: 0 },
    { ns: "apps", name: "open-webui-88bf56d4b-gwsbj", phase: "Running", ready: "1/1", restarts: 0 },
    { ns: "apps", name: "piper-86f7d4cfb4-kvj2f", phase: "Running", ready: "1/1", restarts: 0 },
    { ns: "agents", name: "openclaw-5db6bcccf5-mwbd7", phase: "Running", ready: "1/1", restarts: 0 },
    { ns: "inference", name: "litellm-579c5c948b-d9hdn", phase: "Running", ready: "1/1", restarts: 0 },
    { ns: "monitoring", name: "node-exporter-apps01", phase: "Running", ready: "1/1", restarts: 0 },
  ],
};

export function seedTelemetry(source: "live" | "sim" = "sim", now = Date.now()): Telemetry {
  const originSec = Math.floor(now / 1000);
  const events: ClusterEvent[] = [
    { t: now - 8_000, src: "flux", lvl: "ok", ns: "flux-system", reason: "ReconciliationSucceeded", msg: "Kustomization/flux-system Applied revision: main@sha1:946bad4" },
    { t: now - 14_000, src: "flux", lvl: "ok", ns: "flux-system", reason: "ArtifactUpToDate", msg: "GitRepository/flux-system stored artifact for revision main@sha1:946bad4" },
    { t: now - 28_000, src: "prom", lvl: "ok", ns: "monitoring", reason: "Scrape", msg: "nvidia-gpu-exporter 2/2 Ready" },
    { t: now - 41_000, src: "prom", lvl: "ok", ns: "monitoring", reason: "Scrape", msg: "node-exporter 6/6 Ready" },
    { t: now - 55_000, src: "k8s", lvl: "ok", ns: "apps", reason: "Started", msg: "pod/open-webui-88bf56d4b-gwsbj Container started" },
    { t: now - 72_000, src: "k8s", lvl: "ok", ns: "inference", reason: "Pulled", msg: "pod/ollama-5b95745686-j8blj Successfully pulled image" },
    { t: now - 95_000, src: "openclaw", lvl: "info", ns: "agents", reason: "Ready", msg: "deployment/openclaw gateway listening :18789" },
    { t: now - 140_000, src: "k8s", lvl: "ok", ns: "gitea", reason: "Scheduled", msg: "pod/gitea-6d9cff854f-qhkwc Assigned to ctrl-01" },
    { t: now - 180_000, src: "prom", lvl: "ok", ns: "monitoring", reason: "Scrape", msg: "prometheus scrape loop ok · 18s" },
    { t: now - 240_000, src: "flux", lvl: "ok", ns: "flux-system", reason: "Ready", msg: "Kustomization/apps Healthy" },
  ];
  return {
    ts: now,
    source,
    uptimeSec: Math.floor((now - BOOT_MS) / 1000),
    fluxOk: true,
    nfsOk: true,
    etcdOk: true,
    k3s: K3S_VERSION,
    nodes: NODES.map((n) => ({
      id: n.id,
      cpuPct: n.role === "bastion" ? 3 : n.id === "gpu-01" ? 8 : 4,
      ramPct: n.id === "gpu-01" ? 22 : n.role === "bastion" ? 28 : 8,
      diskPct: n.id.startsWith("gpu") ? 25 : n.id === "apps-01" ? 18 : 14,
      load: n.role === "bastion" ? 0.2 : n.id === "ctrl-01" ? 0.2 : 0.08,
      ready: true,
      kernel: n.kernel,
      kubelet: n.k3s,
      os: "Ubuntu 26.04.1 LTS",
      runtime: n.role === "bastion" ? "—" : "containerd://2.3.4-k3s1.36",
    })),
    gpus: [
      { id: "gpu-01", tempC: 68, utilPct: 2, vramUsedMiB: 6007, vramTotalMiB: 8188, pstate: "P8", uuid: GPU_UUID["gpu-01"] },
      { id: "gpu-02", tempC: 60, utilPct: 0, vramUsedMiB: 1, vramTotalMiB: 8188, pstate: "P8", uuid: GPU_UUID["gpu-02"] },
    ],
    gpuHistory: Array.from({ length: 36 }, (_, i) => ({
      t: originSec - (35 - i) * 30,
      gpu01: 67.2 + Math.sin(i / 5) * 1.1,
      gpu02: 59.4 + Math.cos(i / 6) * 0.8,
      util01: Math.max(0, 3 + Math.sin(i / 3) * 4),
      util02: Math.max(0, 0.4 + Math.cos(i / 4) * 0.6),
    })),
    events,
    eventWindowSec: 600,
    workloads: WORKLOADS.map((w) => ({ ...w })),
    services: SERVICES.map((s) => ({ ...s })),
    podsByNode: Object.fromEntries(
      Object.entries(SIM_PODS).map(([k, v]) => [k, v.map((p) => ({ ...p }))]),
    ),
    inventory: NODES,
  };
}
