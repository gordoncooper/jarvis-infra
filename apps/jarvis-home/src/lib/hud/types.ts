import type { InvNode } from "./inventory";

export type EventSrc = "flux" | "k8s" | "openclaw" | "prom";
export type EventLvl = "ok" | "warn" | "err" | "info";

export type PodRow = {
  ns: string;
  name: string;
  phase: string;
  ready: string;
  restarts: number;
};

export type NodeLive = {
  id: string;
  cpuPct: number;
  ramPct: number;
  diskPct: number;
  load: number;
  ready: boolean;
  kernel: string;
  kubelet: string;
  os?: string;
  runtime?: string;
};

export type GpuLive = {
  id: string;
  tempC: number;
  utilPct: number;
  vramUsedMiB: number;
  vramTotalMiB: number;
  pstate: string;
  uuid: string;
};

export type Service = {
  id: string;
  name: string;
  href: string;
  note: string;
  host: string;
  tls: boolean;
  ns: string;
  workload: string;
};

export type Workload = { ns: string; name: string; node: string; ready: string };

export type ClusterEvent = {
  t: number;
  src: EventSrc;
  lvl: EventLvl;
  ns?: string;
  reason: string;
  msg: string;
};

export type Telemetry = {
  ts: number;
  source: "live" | "sim";
  uptimeSec: number;
  fluxOk: boolean;
  nfsOk: boolean;
  etcdOk: boolean;
  k3s: string;
  nodes: NodeLive[];
  gpus: GpuLive[];
  gpuHistory: { t: number; gpu01: number; gpu02: number; util01: number; util02: number }[];
  events: ClusterEvent[];
  eventWindowSec: number;
  workloads: Workload[];
  services: Service[];
  podsByNode: Record<string, PodRow[]>;
  inventory: InvNode[];
};

export type OverlayKind = "node" | "gpu" | "service" | "cluster";
export type Overlay = { kind: OverlayKind; id: string };
