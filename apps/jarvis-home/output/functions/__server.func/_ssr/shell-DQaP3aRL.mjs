import { i as __toESM } from "../_runtime.mjs";
import { b as require_jsx_runtime, d as useRouterState, v as Link, z as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Hexagon, c as Activity } from "../_libs/lucide-react.mjs";
import { t as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/shell-DQaP3aRL.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var K3S_VERSION = "v1.36.4+k3s1";
var NODES = [
	{
		id: "ctrl-01",
		host: "ctrl-01.lan",
		ip: "192.168.8.11",
		role: "control",
		labels: [
			"jarvis.role=control",
			"control-plane",
			"etcd"
		],
		cpu: "i7-8700T",
		cores: 12,
		ramGiB: 32,
		disk: "160G root",
		extra: "k3s server · Gitea · Flux · Traefik",
		kernel: "7.0.0-30-generic",
		k3s: K3S_VERSION
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
		k3s: K3S_VERSION
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
		k3s: K3S_VERSION
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
		k3s: K3S_VERSION
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
		k3s: K3S_VERSION
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
		extra: "Open WebUI · LiteLLM · Piper · OpenClaw",
		kernel: "7.0.0-30-generic",
		k3s: K3S_VERSION
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
		k3s: "—"
	}
];
var SERVICES = [
	{
		id: "chat",
		name: "Chat",
		href: "https://chat.lan",
		note: "Open WebUI · Whisper STT · Piper TTS",
		host: "apps-01",
		tls: true
	},
	{
		id: "agent",
		name: "Agent",
		href: "http://agent.lan:18789",
		note: "OpenClaw gateway · hostPort 18789",
		host: "apps-01",
		tls: false
	},
	{
		id: "grafana",
		name: "Grafana",
		href: "https://grafana.lan",
		note: "NVIDIA 14574 · node exporters",
		host: "data-02",
		tls: true
	},
	{
		id: "git",
		name: "Gitea",
		href: "http://git.lan",
		note: "Flux origin · stays HTTP",
		host: "ctrl-01",
		tls: false
	},
	{
		id: "llm",
		name: "LiteLLM",
		href: "https://llm.lan/v1",
		note: "jarvis-local · grok · grok-code",
		host: "apps-01",
		tls: true
	}
];
var WORKLOADS = [
	{
		ns: "inference",
		name: "ollama",
		node: "gpu-01",
		ready: "1/1"
	},
	{
		ns: "inference",
		name: "ollama-embed",
		node: "gpu-02",
		ready: "1/1"
	},
	{
		ns: "inference",
		name: "litellm",
		node: "apps-01",
		ready: "1/1"
	},
	{
		ns: "apps",
		name: "open-webui",
		node: "apps-01",
		ready: "1/1"
	},
	{
		ns: "apps",
		name: "piper",
		node: "apps-01",
		ready: "1/1"
	},
	{
		ns: "agents",
		name: "openclaw",
		node: "apps-01",
		ready: "1/1"
	},
	{
		ns: "gitea",
		name: "gitea",
		node: "ctrl-01",
		ready: "1/1"
	},
	{
		ns: "flux-system",
		name: "kustomize-controller",
		node: "ctrl-01",
		ready: "1/1"
	},
	{
		ns: "monitoring",
		name: "prometheus",
		node: "data-02",
		ready: "1/1"
	},
	{
		ns: "monitoring",
		name: "grafana",
		node: "data-02",
		ready: "1/1"
	},
	{
		ns: "kube-system",
		name: "traefik",
		node: "ctrl-01",
		ready: "1/1"
	}
];
var ROLE_LABEL = {
	control: "CONTROL",
	"gpu-chat": "GPU / CHAT",
	"gpu-embed": "GPU / EMBED",
	"storage-primary": "NFS PRIMARY",
	"storage-replica": "METRICS",
	apps: "APPS",
	bastion: "BASTION"
};
var GPU_UUID = {
	"gpu-01": "GPU-e8a5b185-1cc6-fded-c5ba-6e759b6f089f",
	"gpu-02": "GPU-7a9531af-c188-5b0a-7208-e9bd3ba392b2"
};
/** Fixed origin so SSR HTML matches the first client paint. */
var BOOT_MS = Date.parse("2026-09-03T16:00:00-07:00");
var T0 = Date.parse("2026-09-14T21:00:00-07:00");
function clamp(n, a, b) {
	return Math.min(b, Math.max(a, n));
}
function walk(prev, step, min, max) {
	return clamp(prev + (Math.random() - .48) * step, min, max);
}
function initial() {
	const nodes = NODES.map((n) => ({
		id: n.id,
		cpuPct: n.role === "bastion" ? 8 : n.role.startsWith("gpu") ? 14 : 9,
		ramPct: n.role === "bastion" ? 18 : n.id === "gpu-01" ? 22 : 16,
		diskPct: n.id === "apps-01" ? 15 : n.id === "gpu-01" ? 15 : 9,
		load: n.role === "bastion" ? .4 : .7,
		ready: true
	}));
	return {
		ts: T0,
		uptimeSec: Math.floor((T0 - BOOT_MS) / 1e3),
		fluxOk: true,
		nfsOk: true,
		etcdOk: true,
		nodes,
		gpus: [{
			id: "gpu-01",
			tempC: 69,
			utilPct: 2,
			vramUsedMiB: 6009,
			vramTotalMiB: 8188,
			pstate: "P8",
			uuid: GPU_UUID["gpu-01"]
		}, {
			id: "gpu-02",
			tempC: 54,
			utilPct: 0,
			vramUsedMiB: 407,
			vramTotalMiB: 8188,
			pstate: "P8",
			uuid: GPU_UUID["gpu-02"]
		}],
		gpuHistory: Array.from({ length: 36 }, (_, i) => ({
			t: i,
			gpu01: 68 + Math.sin(i / 5) * 1.2,
			gpu02: 53 + Math.cos(i / 6) * 1.4,
			util01: Math.max(0, 4 + Math.sin(i / 3) * 6),
			util02: Math.max(0, 1 + Math.cos(i / 4) * 2)
		})),
		events: [
			{
				t: T0 - 4e4,
				lvl: "ok",
				msg: "flux-system reconciled main@54bf0a5"
			},
			{
				t: T0 - 9e4,
				lvl: "info",
				msg: "ollama jarvis SYSTEM rebuilt (gpu-02 inventory)"
			},
			{
				t: T0 - 18e4,
				lvl: "ok",
				msg: "nvidia-gpu-exporter 2/2 Ready"
			},
			{
				t: T0 - 4e5,
				lvl: "ok",
				msg: "nfs4 data-01:/cluster/nfs mounted 5 clients"
			},
			{
				t: T0 - 9e5,
				lvl: "info",
				msg: "etcd on-demand snapshot 11M → /cluster/nfs/snapshots"
			}
		]
	};
}
var state = initial();
var listeners = /* @__PURE__ */ new Set();
var ticking = false;
function tick() {
	const now = Date.now();
	const nodes = state.nodes.map((n) => ({
		...n,
		cpuPct: walk(n.cpuPct, 2.4, 3, n.id === "gpu-01" ? 38 : 28),
		ramPct: walk(n.ramPct, .6, 10, 40),
		diskPct: n.diskPct,
		load: walk(n.load, .15, .1, 2.4)
	}));
	const gpus = state.gpus.map((g) => {
		const isChat = g.id === "gpu-01";
		return {
			...g,
			tempC: walk(g.tempC, isChat ? .7 : .5, isChat ? 62 : 48, isChat ? 76 : 66),
			utilPct: walk(g.utilPct, isChat ? 8 : 3, 0, isChat ? 55 : 18),
			vramUsedMiB: isChat ? walk(g.vramUsedMiB, 12, 5900, 6100) : walk(g.vramUsedMiB, 4, 380, 430)
		};
	});
	const hist = state.gpuHistory.slice(-47).concat({
		t: (state.gpuHistory.at(-1)?.t ?? 0) + 1,
		gpu01: gpus[0].tempC,
		gpu02: gpus[1].tempC,
		util01: gpus[0].utilPct,
		util02: gpus[1].utilPct
	});
	let events = state.events;
	if (Math.random() < .12) {
		const msgs = [
			{
				lvl: "ok",
				msg: "prometheus scrape nvidia-gpu-exporter ok"
			},
			{
				lvl: "info",
				msg: `gpu-01 ${gpus[0].tempC.toFixed(0)}C  ${gpus[0].vramUsedMiB.toFixed(0)} MiB`
			},
			{
				lvl: "info",
				msg: `gpu-02 ${gpus[1].tempC.toFixed(0)}C  embed resident`
			},
			{
				lvl: "ok",
				msg: "coredns 1/1 · metrics-server 1/1"
			},
			{
				lvl: "ok",
				msg: "traefik svclb 6 endpoints"
			}
		];
		events = [{
			t: now,
			...msgs[Math.floor(Math.random() * msgs.length)]
		}, ...events].slice(0, 18);
	}
	state = {
		...state,
		ts: now,
		uptimeSec: Math.floor((now - BOOT_MS) / 1e3),
		nodes,
		gpus,
		gpuHistory: hist,
		events
	};
	listeners.forEach((l) => l());
}
function subscribeTelemetry(fn) {
	listeners.add(fn);
	if (typeof window !== "undefined" && !ticking) {
		ticking = true;
		window.setTimeout(() => {
			window.setInterval(tick, 1800);
		}, 50);
	}
	return () => listeners.delete(fn);
}
function getTelemetry() {
	return state;
}
function formatUptime(sec) {
	const d = Math.floor(sec / 86400);
	const h = Math.floor(sec % 86400 / 3600);
	const m = Math.floor(sec % 3600 / 60);
	return `${d}d ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`;
}
function Clock() {
	const [now, setNow] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		const stamp = () => setNow(Date.now());
		stamp();
		const id = window.setInterval(stamp, 1e3);
		return () => window.clearInterval(id);
	}, []);
	if (now === null) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("time", {
		className: "font-mono text-xs tabular-nums text-muted",
		dateTime: "",
		children: "--:--:--"
	});
	const d = new Date(now);
	const hh = String(d.getHours()).padStart(2, "0");
	const mm = String(d.getMinutes()).padStart(2, "0");
	const ss = String(d.getSeconds()).padStart(2, "0");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("time", {
		className: "font-mono text-xs tabular-nums text-muted",
		dateTime: d.toISOString(),
		children: [
			hh,
			":",
			mm,
			":",
			ss
		]
	});
}
function Shell({ children, denser = false }) {
	const path = useRouterState({ select: (s) => s.location.pathname });
	const tel = (0, import_react.useSyncExternalStore)(subscribeTelemetry, getTelemetry, getTelemetry);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("min-h-dvh bg-bg text-fg", denser && "hud-grid"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
			className: "sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur-sm",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/",
						className: "flex items-center gap-2 text-fg no-underline",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hexagon, {
							className: "size-5 text-accent",
							strokeWidth: 1.6
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono text-sm font-medium tracking-[0.18em]",
							children: "JARVIS"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
						className: "ml-2 flex gap-1",
						"aria-label": "Primary",
						children: [{
							to: "/",
							label: "Home"
						}, {
							to: "/status",
							label: "Status"
						}].map((n) => {
							const on = path === n.to;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: n.to,
								className: cn("px-3 py-2 text-xs font-medium tracking-[0.14em] uppercase no-underline transition-colors duration-150", on ? "text-accent" : "text-muted hover:text-fg"),
								children: n.label
							}, n.to);
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ml-auto flex items-center gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "hidden items-center gap-1.5 font-mono text-[10px] tracking-widest text-muted sm:flex",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, { className: "size-3 text-ok" }),
								tel.nodes.filter((n) => n.ready).length,
								"/",
								tel.nodes.length,
								" NOMINAL"
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, {})]
					})
				]
			})
		}), children]
	});
}
//#endregion
export { WORKLOADS as a, getTelemetry as c, Shell as i, subscribeTelemetry as l, ROLE_LABEL as n, cn as o, SERVICES as r, formatUptime as s, NODES as t };
