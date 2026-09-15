// @ts-nocheck — k8s/prometheus JSON is untyped; runtime-validated via seed fallback.
import { request } from "node:https";
import { readFileSync } from "node:fs";
import { NODES, WORKLOADS, K3S_VERSION, SERVICES } from "./inventory";
import { seedTelemetry } from "./seed";
import type { Telemetry } from "./types";

const SA = "/var/run/secrets/kubernetes.io/serviceaccount";
const WINDOW_MS = 600_000;
const DEFAULT_PROM = "http://prometheus.monitoring.svc:9090";

function parseTime(raw) {
  if (!raw) return 0;
  const n = Date.parse(raw);
  return Number.isFinite(n) ? n : 0;
}

function classifySrc(ns, kind, name) {
  const k = (kind || "").toLowerCase();
  const n = (name || "").toLowerCase();
  if (ns === "flux-system" || k.includes("kustomization") || k.includes("gitrepository")) return "flux";
  if (ns === "agents" || n.includes("openclaw")) return "openclaw";
  if (ns === "monitoring" || n.includes("prometheus") || n.includes("grafana")) return "prom";
  return "k8s";
}

function classifyLvl(type, reason) {
  const r = (reason || "").toLowerCase();
  if (type === "Warning" || r.includes("fail") || r.includes("error") || r.includes("backoff") || r.includes("unhealthy") || r.includes("timeout")) {
    if (r.includes("backoff") || r.includes("fail") || r.includes("error") || r.includes("crash")) return "err";
    return "warn";
  }
  if (r.includes("succeed") || r.includes("started") || r.includes("ready") || r.includes("pulled") || r.includes("created")) return "ok";
  return "info";
}

function k8sGet(path, timeoutMs) {
  const host = process.env.KUBERNETES_SERVICE_HOST;
  const port = process.env.KUBERNETES_SERVICE_PORT || "443";
  if (!host) return Promise.reject(new Error("not in cluster"));
  const token = readFileSync(`${SA}/token`, "utf8").trim();
  const ca = readFileSync(`${SA}/ca.crt`);
  return new Promise((resolve, reject) => {
    const req = request({
      hostname: host, port, path, method: "GET", ca,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      timeout: timeoutMs,
    }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf8");
        if ((res.statusCode ?? 500) >= 400) {
          reject(new Error(`k8s ${res.statusCode} ${path}`));
          return;
        }
        try { resolve(JSON.parse(body)); } catch (err) { reject(err); }
      });
    });
    req.on("timeout", () => { req.destroy(); reject(new Error("k8s timeout")); });
    req.on("error", reject);
    req.end();
  });
}

function fromCoreEvent(ev, now) {
  const t = parseTime(ev.eventTime) || parseTime(ev.lastTimestamp) || parseTime(ev.firstTimestamp) || parseTime(ev.metadata?.creationTimestamp);
  if (!t || t < now - WINDOW_MS) return null;
  const ns = ev.involvedObject?.namespace || ev.metadata?.namespace || "";
  if (ns === "kube-system" && ev.type !== "Warning") return null;
  const kind = ev.involvedObject?.kind || "Event";
  const name = ev.involvedObject?.name || ev.metadata?.name || "";
  const reason = ev.reason || "Event";
  const msgCore = (ev.message || reason).replace(/\s+/g, " ").trim();
  const obj = `${kind.toLowerCase()}/${name}`;
  const count = ev.count && ev.count > 1 ? ` ×${ev.count}` : "";
  return {
    t, src: classifySrc(ns, kind, name), lvl: classifyLvl(ev.type || "Normal", reason),
    ns: ns || undefined, reason, msg: `${obj} ${msgCore}${count}`.slice(0, 180),
  };
}

function fromFlux(kind, item, now) {
  const name = item.metadata?.name || kind.toLowerCase();
  const ns = item.metadata?.namespace || "flux-system";
  const out = [];
  for (const c of item.status?.conditions ?? []) {
    const t = parseTime(c.lastTransitionTime);
    if (!t || t < now - WINDOW_MS) continue;
    const ok = c.status === "True";
    const reason = c.reason || c.type || "Condition";
    const msg = (c.message || reason).replace(/\s+/g, " ").trim();
    out.push({
      t, src: "flux", lvl: ok ? "ok" : c.type === "Ready" ? "err" : "warn", ns, reason,
      msg: `${kind}/${name} ${msg}`.slice(0, 180),
    });
  }
  return out;
}

function dedupe(events) {
  const seen = new Set();
  const out = [];
  for (const e of events.sort((a, b) => b.t - a.t)) {
    const key = `${e.src}|${e.reason}|${e.msg}|${Math.floor(e.t / 15000)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(e);
  }
  return out.slice(0, 80);
}

async function collectClusterEvents(now) {
  if (!process.env.KUBERNETES_SERVICE_HOST) return [];
  try {
    const [evWrap, ksWrap, gitWrap] = await Promise.allSettled([
      k8sGet("/api/v1/events?limit=250", 2000),
      k8sGet("/apis/kustomize.toolkit.fluxcd.io/v1/kustomizations", 2000),
      k8sGet("/apis/source.toolkit.fluxcd.io/v1/gitrepositories", 2000),
    ]);
    const gathered = [];
    if (evWrap.status === "fulfilled") {
      for (const ev of evWrap.value.items ?? []) {
        const row = fromCoreEvent(ev, now);
        if (row) gathered.push(row);
      }
    }
    if (ksWrap.status === "fulfilled") {
      for (const it of ksWrap.value.items ?? []) gathered.push(...fromFlux("Kustomization", it, now));
    }
    if (gitWrap.status === "fulfilled") {
      for (const it of gitWrap.value.items ?? []) gathered.push(...fromFlux("GitRepository", it, now));
    }
    return dedupe(gathered);
  } catch {
    return [];
  }
}

async function collectPodsByNode() {
  const empty = {};
  if (!process.env.KUBERNETES_SERVICE_HOST) return empty;
  try {
    const wrap = await k8sGet("/api/v1/pods?limit=500", 2500);
    const by = {};
    for (const p of wrap.items ?? []) {
      const phase = p.status?.phase || "";
      if (phase === "Succeeded" || phase === "Failed") continue;
      const node = p.spec?.nodeName;
      if (!node) continue;
      const ns = p.metadata?.namespace || "";
      const name = p.metadata?.name || "";
      const css = p.status?.containerStatuses || [];
      const readyN = css.filter((c) => c.ready).length;
      const restarts = css.reduce((s, c) => s + (c.restartCount || 0), 0);
      (by[node] ||= []).push({
        ns, name, phase, ready: `${readyN}/${css.length || 1}`, restarts,
      });
    }
    for (const k of Object.keys(by)) {
      by[k].sort((a, b) => a.ns.localeCompare(b.ns) || a.name.localeCompare(b.name));
    }
    return by;
  } catch {
    return empty;
  }
}

async function collectNodeFacts() {
  const out = {};
  if (!process.env.KUBERNETES_SERVICE_HOST) return out;
  try {
    const wrap = await k8sGet("/api/v1/nodes", 2000);
    for (const n of wrap.items ?? []) {
      const id = n.metadata?.name;
      if (!id) continue;
      const info = n.status?.nodeInfo || {};
      const cond = (n.status?.conditions || []).find((c) => c.type === "Ready");
      out[id] = {
        kernel: info.kernelVersion || "",
        kubelet: info.kubeletVersion || "",
        os: info.osImage || "",
        runtime: info.containerRuntimeVersion || "",
        ready: cond?.status === "True",
      };
    }
  } catch {}
  return out;
}

function num(row, fallback = 0) {
  if (!row) return fallback;
  const n = Number(row.value[1]);
  return Number.isFinite(n) ? n : fallback;
}
function toMiB(v, fallback) {
  if (!Number.isFinite(v) || v <= 0) return fallback;
  return v > 1e5 ? v / 1048576 : v;
}
function byInstance(rows) {
  const m = new Map();
  for (const r of rows) {
    const id = r.metric.instance || r.metric.node || "";
    if (id) m.set(id, r);
  }
  return m;
}

async function promJson(url, ms) {
  const r = await fetch(url, { signal: AbortSignal.timeout(ms) });
  if (!r.ok) throw new Error(`prometheus HTTP ${r.status}`);
  const j = await r.json();
  if (j.status !== "success") throw new Error(j.error || "prometheus query failed");
  return j.data?.result ?? [];
}
async function query(base, q, ms) {
  return await promJson(`${base}/api/v1/query?query=${encodeURIComponent(q)}`, ms);
}
async function queryRange(base, q, start, end, step, ms) {
  return await promJson(`${base}/api/v1/query_range?query=${encodeURIComponent(q)}&start=${start}&end=${end}&step=${step}`, ms);
}

const Q = {
  gpuTemp: "nvidia_smi_temperature_gpu",
  gpuUtil: "nvidia_smi_utilization_gpu",
  gpuMemUsed: "nvidia_smi_memory_used_bytes",
  gpuMemTotal: "nvidia_smi_memory_total_bytes",
  gpuInfo: "nvidia_smi_gpu_info",
  gpuPstate: "nvidia_smi_pstate",
  cpu: '100 * (1 - avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[2m])))',
  ram: "100 * (1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)",
  disk: '100 * (1 - node_filesystem_avail_bytes{mountpoint="/",fstype!~"tmpfs|overlay|squashfs|nsfs"} / node_filesystem_size_bytes{mountpoint="/",fstype!~"tmpfs|overlay|squashfs|nsfs"})',
  load: "node_load1",
  boot: "node_boot_time_seconds",
  nodeUp: 'up{job="node-exporter"}',
  gpuUp: 'up{job="nvidia-gpu-exporter"}',
  nfs: 'count(node_filesystem_size_bytes{mountpoint="/mnt/nfs"})',
  flux: 'kube_deployment_status_replicas_available{namespace="flux-system",deployment="kustomize-controller"}',
  depReady: "kube_deployment_status_replicas_available",
  depSpec: "kube_deployment_spec_replicas",
};

function pstateLabel(v) {
  if (!Number.isFinite(v) || v < 0) return "P8";
  return `P${Math.round(v)}`;
}

async function scrapePrometheus() {
  const inCluster = Boolean(process.env.KUBERNETES_SERVICE_HOST);
  const explicit = process.env.PROMETHEUS_URL;
  const base = (explicit ?? DEFAULT_PROM).replace(/\/$/, "");
  if (!base || base === "off" || (!inCluster && !explicit)) {
    return seedTelemetry("sim", Date.now());
  }
  const [
    gpuTemp, gpuUtil, gpuMemUsed, gpuMemTotal, gpuInfo, gpuPstate,
    cpu, ram, disk, load, boot, nodeUp, gpuUp, nfs, flux, depReady, depSpec,
    podsByNode, nodeFacts,
  ] = await Promise.all([
    query(base, Q.gpuTemp, 2500),
    query(base, Q.gpuUtil, 2500),
    query(base, Q.gpuMemUsed, 2500),
    query(base, Q.gpuMemTotal, 2500),
    query(base, Q.gpuInfo, 2500),
    query(base, Q.gpuPstate, 2500),
    query(base, Q.cpu, 2500),
    query(base, Q.ram, 2500),
    query(base, Q.disk, 2500),
    query(base, Q.load, 2500),
    query(base, Q.boot, 2500),
    query(base, Q.nodeUp, 2500),
    query(base, Q.gpuUp, 2500),
    query(base, Q.nfs, 2500),
    query(base, Q.flux, 2500),
    query(base, Q.depReady, 2500),
    query(base, Q.depSpec, 2500),
    collectPodsByNode(),
    collectNodeFacts(),
  ]);
  const tMap = byInstance(gpuTemp);
  const uMap = byInstance(gpuUtil);
  const muMap = byInstance(gpuMemUsed);
  const mtMap = byInstance(gpuMemTotal);
  const infoMap = byInstance(gpuInfo);
  const psMap = byInstance(gpuPstate);
  const cpuMap = byInstance(cpu);
  const ramMap = byInstance(ram);
  const diskMap = byInstance(disk);
  const loadMap = byInstance(load);
  const bootMap = byInstance(boot);
  const upMap = byInstance(nodeUp);
  const fallback = seedTelemetry("sim");
  const now = Date.now();
  const gpus = ["gpu-01", "gpu-02"].map((id, i) => {
    const prev = fallback.gpus[i];
    const info = infoMap.get(id);
    return {
      id,
      tempC: num(tMap.get(id), prev.tempC),
      utilPct: num(uMap.get(id), prev.utilPct),
      vramUsedMiB: toMiB(num(muMap.get(id), 0), prev.vramUsedMiB),
      vramTotalMiB: toMiB(num(mtMap.get(id), 0), prev.vramTotalMiB),
      pstate: pstateLabel(num(psMap.get(id), NaN)),
      uuid: info?.metric.uuid || prev.uuid,
    };
  });
  const nodes = NODES.map((n) => {
    const facts = nodeFacts[n.id] || {};
    const prev = fallback.nodes.find((s) => s.id === n.id);
    if (n.role === "bastion") {
      return { ...prev, ready: true, kernel: n.kernel, kubelet: "—" };
    }
    return {
      id: n.id,
      cpuPct: num(cpuMap.get(n.id), prev.cpuPct),
      ramPct: num(ramMap.get(n.id), prev.ramPct),
      diskPct: num(diskMap.get(n.id), prev.diskPct),
      load: num(loadMap.get(n.id), prev.load),
      ready: facts.ready ?? num(upMap.get(n.id), 0) === 1,
      kernel: facts.kernel || n.kernel,
      kubelet: facts.kubelet || n.k3s,
      os: facts.os || "",
      runtime: facts.runtime || "",
    };
  });
  const readyKey = (ns, name) => `${ns}/${name}`;
  const ready = new Map();
  const spec = new Map();
  for (const r of depReady) ready.set(readyKey(r.metric.namespace ?? "", r.metric.deployment ?? ""), Number(r.value[1]));
  for (const r of depSpec) spec.set(readyKey(r.metric.namespace ?? "", r.metric.deployment ?? ""), Number(r.value[1]));
  const workloads = WORKLOADS.map((w) => {
    const k = readyKey(w.ns, w.name);
    const av = ready.get(k);
    const sp = spec.get(k);
    if (av == null || sp == null) return w;
    return { ...w, ready: `${av}/${sp}` };
  });
  const ctrlBoot = num(bootMap.get("ctrl-01"), 0);
  const uptimeSec = ctrlBoot > 0 ? Math.max(0, Math.floor(now / 1000 - ctrlBoot)) : fallback.uptimeSec;
  const end = Math.floor(now / 1000);
  const start = end - 1080;
  let gpuHistory = fallback.gpuHistory;
  try {
    const [h1, h2, hu1, hu2] = await Promise.all([
      queryRange(base, 'nvidia_smi_temperature_gpu{instance="gpu-01"}', start, end, 30, 2500),
      queryRange(base, 'nvidia_smi_temperature_gpu{instance="gpu-02"}', start, end, 30, 2500),
      queryRange(base, 'nvidia_smi_utilization_gpu{instance="gpu-01"}', start, end, 30, 2500),
      queryRange(base, 'nvidia_smi_utilization_gpu{instance="gpu-02"}', start, end, 30, 2500),
    ]);
    const a = h1[0]?.values ?? [];
    const b = h2[0]?.values ?? [];
    const c = hu1[0]?.values ?? [];
    const d = hu2[0]?.values ?? [];
    const n = Math.max(a.length, b.length, c.length, d.length);
    if (n > 2) {
      gpuHistory = Array.from({ length: n }, (_, i) => ({
        t: Number(a[i]?.[0] ?? b[i]?.[0] ?? start + i * 30),
        gpu01: Number(a[i]?.[1] ?? gpus[0].tempC),
        gpu02: Number(b[i]?.[1] ?? gpus[1].tempC),
        util01: Number(c[i]?.[1] ?? gpus[0].utilPct),
        util02: Number(d[i]?.[1] ?? gpus[1].utilPct),
      }));
    }
  } catch {}
  const gpuExportersUp = gpuUp.filter((r) => Number(r.value[1]) === 1).length;
  const nodeExportersUp = nodeUp.filter((r) => Number(r.value[1]) === 1).length;
  const nfsClients = num(nfs[0], 0);
  const fluxOk = num(flux[0], 0) >= 1;
  let events = await collectClusterEvents(now);
  if (events.length === 0) {
    events = [
      { t: now, src: "prom", lvl: gpuExportersUp === 2 ? "ok" : "warn", ns: "monitoring", reason: "Scrape", msg: `nvidia-gpu-exporter ${gpuExportersUp}/2 Ready` },
      { t: now - 1000, src: "prom", lvl: nodeExportersUp >= 6 ? "ok" : "warn", ns: "monitoring", reason: "Scrape", msg: `node-exporter ${nodeExportersUp}/6` },
    ];
  }
  return {
    ts: now,
    source: "live",
    uptimeSec,
    fluxOk,
    nfsOk: nfsClients >= 4,
    etcdOk: nodes.find((n) => n.id === "ctrl-01")?.ready ?? false,
    k3s: K3S_VERSION,
    nodes,
    gpus,
    gpuHistory,
    events,
    eventWindowSec: 600,
    workloads,
    services: SERVICES.map((s) => ({ ...s })),
    podsByNode,
    inventory: NODES,
  };
}

export async function scrapeTelemetrySafe(): Promise<Telemetry> {
  try {
    return await Promise.race([
      scrapePrometheus(),
      new Promise((_, rej) => setTimeout(() => rej(new Error("prometheus scrape timeout")), 4000)),
    ]);
  } catch {
    const sim = seedTelemetry("sim", Date.now());
    const livePods = await collectPodsByNode();
    if (Object.keys(livePods).length) sim.podsByNode = livePods;
    return sim;
  }
}

