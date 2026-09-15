import { i as __toESM } from "../_runtime.mjs";
import { b as require_jsx_runtime, d as useRouterState, v as Link, z as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as Hexagon } from "../_libs/lucide-react.mjs";
import { n as seedTelemetry, r as ROLE_LABEL } from "./router-CsBJqbaI.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/shell-DJayrTbX.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Bar({ pct }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "h-bar bg-line overflow-hidden rounded-full",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {
			className: "block h-full bg-accent",
			style: { width: `${Math.max(0, Math.min(100, pct || 0)).toFixed(0)}%` }
		})
	});
}
function MetricBars({ cpuPct, ramPct, diskPct }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-1.5 grid gap-1",
		children: [
			["cpu", cpuPct],
			["ram", ramPct],
			["disk", diskPct]
		].map(([k, v]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-[2.4rem_1fr_auto] items-center gap-1.5 font-mono text-2xs text-faint",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: k }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, { pct: v ?? 0 }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: v == null ? "—" : `${v.toFixed(0)}%` })
			]
		}, k))
	});
}
function fmtUptime(sec) {
	const d = Math.floor(sec / 86400);
	const h = Math.floor(sec % 86400 / 3600);
	const m = Math.floor(sec % 3600 / 60);
	return `${d}d ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`;
}
function clockLabel(t) {
	const ms = t > 0xe8d4a51000 ? t : t * 1e3;
	return new Date(ms).toISOString().slice(11, 19);
}
var FILTERS = [
	{
		id: "all",
		label: "all"
	},
	{
		id: "flux",
		label: "flux"
	},
	{
		id: "k8s",
		label: "k8s"
	},
	{
		id: "openclaw",
		label: "claw"
	},
	{
		id: "prom",
		label: "prom"
	}
];
function EventStream({ tel }) {
	const [filter, setFilter] = (0, import_react.useState)("all");
	const items = tel.events.filter((e) => filter === "all" || e.src === filter);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mt-4 rounded-xs border border-line bg-elev",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "flex flex-wrap items-center gap-2 border-b border-line px-3 py-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
				className: "font-mono text-2xs font-medium tracking-[0.2em] text-muted",
				children: [
					"Event stream · last 10 min · ",
					items.length,
					" shown"
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "ml-auto flex gap-0.5",
				children: FILTERS.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setFilter(f.id),
					className: filter === f.id ? "rounded-xs border border-accent/50 px-1.5 py-0.5 font-mono text-2xs uppercase tracking-wider text-accent" : "rounded-xs border border-line px-1.5 py-0.5 font-mono text-2xs uppercase tracking-wider text-muted",
					children: f.label
				}, f.id))
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
			className: "elog max-h-60 overflow-auto font-mono text-xs",
			children: [items.slice(0, 40).map((e, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "grid grid-cols-[4.5rem_3.2rem_1fr] gap-2 border-b border-line px-3 py-1.5 max-sm:grid-cols-[3.6rem_1fr]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-faint",
						children: clockLabel(e.t)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: `uppercase tracking-wide max-sm:hidden lvl-${e.lvl}`,
						children: e.src
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: e.msg })
				]
			}, `${e.t}-${i}`)), items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "grid grid-cols-[4.5rem_1fr] gap-2 px-3 py-2 text-faint",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "—" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "no events" })]
			}) : null]
		})]
	});
}
var OverlayCtx = (0, import_react.createContext)(null);
function OverlayProvider({ children }) {
	const [overlay, setOverlay] = (0, import_react.useState)(null);
	const open = (0, import_react.useCallback)((kind, id) => setOverlay({
		kind,
		id
	}), []);
	const close = (0, import_react.useCallback)(() => setOverlay(null), []);
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
			if (e.key === "Escape") close();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [close]);
	const value = (0, import_react.useMemo)(() => ({
		overlay,
		open,
		close
	}), [
		overlay,
		open,
		close
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OverlayCtx.Provider, {
		value,
		children
	});
}
function useOverlay() {
	const ctx = (0, import_react.useContext)(OverlayCtx);
	if (!ctx) throw new Error("useOverlay outside provider");
	return ctx;
}
var state = seedTelemetry("sim");
var listeners = /* @__PURE__ */ new Set();
var ticking = false;
function emit() {
	listeners.forEach((l) => l());
}
async function pull() {
	try {
		const r = await fetch("/api/telemetry", { cache: "no-store" });
		if (!r.ok) return;
		const next = await r.json();
		if (!next || !Array.isArray(next.gpus) || !Array.isArray(next.nodes)) return;
		state = next;
		emit();
	} catch {}
}
function subscribe(fn) {
	listeners.add(fn);
	if (typeof window !== "undefined" && !ticking) {
		ticking = true;
		pull();
		window.setInterval(() => void pull(), 5e3);
	}
	return () => listeners.delete(fn);
}
function useTelemetry() {
	return (0, import_react.useSyncExternalStore)(subscribe, () => state, () => state);
}
function Spark({ values }) {
	const vals = values.filter(Number.isFinite);
	if (vals.length < 2) return null;
	const w = 320;
	const h = 88;
	const pad = 4;
	const min = Math.min(...vals);
	const span = Math.max(...vals) - min || 1;
	const xy = vals.map((v, i) => {
		return [pad + i / (vals.length - 1) * 312, 84 - (v - min) / span * 80];
	});
	const line = xy.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
	const area = `${pad},84 ${line} ${xy[xy.length - 1][0].toFixed(1)},84`;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		className: "h-spark w-full",
		viewBox: `0 0 ${w} ${h}`,
		preserveAspectRatio: "none",
		"aria-hidden": true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("polygon", {
			className: "fill-accent/15",
			points: area
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("polyline", {
			fill: "none",
			className: "stroke-accent",
			strokeWidth: "1.6",
			points: line
		})]
	});
}
function PodList({ pods }) {
	if (!pods.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
		className: "grid grid-cols-[5.4rem_1fr_auto] gap-2 border-b border-line py-1 font-mono text-xs",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-faint",
				children: "—"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "none / not scheduled" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: pods.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
		className: "grid grid-cols-[5.4rem_1fr_auto] gap-2 border-b border-line py-1 font-mono text-xs",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-faint",
				children: p.ns
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: p.name }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [p.ready, p.restarts ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "text-warn",
				children: [" r", p.restarts]
			}) : null] })
		]
	}, `${p.ns}/${p.name}`)) });
}
function Dossier() {
	const { overlay, close, open } = useOverlay();
	const tel = useTelemetry();
	if (!overlay) return null;
	const inv = (id) => tel.inventory.find((n) => n.id === id);
	const live = (id) => tel.nodes.find((n) => n.id === id);
	const podsOn = (id) => tel.podsByNode[id] || [];
	let kicker = "";
	let title = "";
	let body = null;
	if (overlay.kind === "node") {
		const n = inv(overlay.id);
		const st = live(overlay.id);
		const pods = podsOn(overlay.id);
		const wls = tel.workloads.filter((w) => w.node === overlay.id);
		kicker = "Host dossier";
		title = n?.id || overlay.id;
		body = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "kv",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "role" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: ROLE_LABEL[n?.role || ""] || n?.role }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "ip" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: n?.ip }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "cpu" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", { children: [
						n?.cpu,
						" · ",
						n?.cores,
						" threads · ",
						st?.cpuPct?.toFixed(0) ?? "—",
						"%"
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "ram" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", { children: [
						n?.ramGiB,
						" GiB · ",
						st?.ramPct?.toFixed(0) ?? "—",
						"% used"
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "disk" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", { children: [
						n?.disk,
						" · ",
						st?.diskPct?.toFixed(0) ?? "—",
						"%"
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "load" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: st?.load?.toFixed(2) ?? "—" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "kernel" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: st?.kernel || n?.kernel }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "kubelet" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: st?.kubelet || n?.k3s }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "runtime" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: st?.runtime || (n?.role === "bastion" ? "—" : "containerd") }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "os" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: st?.os || "—" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "labels" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: (n?.labels || []).join(" ") }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "notes" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: n?.extra }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "ready" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: n?.role === "bastion" ? "jump (not a k3s node)" : st?.ready ? "Ready" : "NotReady" })
				]
			}),
			wls.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 mb-1 font-mono text-2xs uppercase tracking-[0.3em] text-accent",
				children: "Pinned workloads"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: wls.map((w) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "grid grid-cols-[4.5rem_1fr] gap-2 border-b border-line py-1 font-mono text-xs",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-faint",
					children: w.ns
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
					w.name,
					" · ",
					w.ready
				] })]
			}, w.name)) })] }) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-4 mb-1 font-mono text-2xs uppercase tracking-[0.3em] text-accent",
				children: [
					"Pods on ",
					overlay.id,
					" · ",
					pods.length
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PodList, { pods }) })
		] });
	} else if (overlay.kind === "gpu") {
		const g = tel.gpus.find((x) => x.id === overlay.id) || tel.gpus[0];
		const n = inv(overlay.id);
		const key = overlay.id === "gpu-02" ? "gpu02" : "gpu01";
		kicker = "GPU dossier";
		title = overlay.id.toUpperCase();
		body = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "kv",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "sku" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: "RTX A1000 8 GiB" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "temp" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", { children: [g.tempC.toFixed(1), " °C"] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "util" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", { children: [g.utilPct.toFixed(0), "%"] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "pstate" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: g.pstate }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "vram" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", { children: [
						g.vramUsedMiB.toFixed(0),
						" / ",
						g.vramTotalMiB.toFixed(0),
						" MiB"
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "uuid" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: g.uuid }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "host" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", { children: [
						n?.ip,
						" · ",
						n?.extra
					] })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Spark, { values: tel.gpuHistory.map((h) => key === "gpu01" ? h.gpu01 : h.gpu02) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-4 mb-1 font-mono text-2xs uppercase tracking-[0.3em] text-accent",
				children: ["Pods on ", overlay.id]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PodList, { pods: podsOn(overlay.id) }) })
		] });
	} else if (overlay.kind === "service") {
		const s = tel.services.find((x) => x.id === overlay.id);
		if (!s) return null;
		const w = tel.workloads.find((x) => x.name === s.workload);
		const evs = tel.events.filter((e) => (e.msg || "").includes(s.workload) || e.ns === s.ns).slice(0, 8);
		kicker = "Service dossier";
		title = s.name;
		body = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "kv",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "url" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						className: "font-mono text-sm text-accent",
						href: s.href,
						target: "_blank",
						rel: "noreferrer",
						children: s.href
					}) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "tls" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: s.tls ? "HTTPS" : "HTTP on purpose" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "node" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "bg-transparent p-0 font-mono text-accent",
						onClick: () => open("node", s.host),
						children: s.host
					}) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "namespace" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: s.ns }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "workload" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", { children: [
						s.workload,
						" · ",
						w?.ready || "—"
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "note" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: s.note })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 mb-1 font-mono text-2xs uppercase tracking-[0.3em] text-accent",
				children: "Recent events"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: evs.length ? evs.map((e, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "grid grid-cols-[4.5rem_3.2rem_1fr] gap-2 border-b border-line py-1 font-mono text-xs",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-faint",
						children: clockLabel(e.t)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: `lvl-${e.lvl}`,
						children: e.src
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: e.msg })
				]
			}, i)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
				className: "py-1 font-mono text-xs text-faint",
				children: "none in window"
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-4 mb-1 font-mono text-2xs uppercase tracking-[0.3em] text-accent",
				children: ["Pods on ", s.host]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PodList, { pods: podsOn(s.host).filter((p) => p.ns === s.ns || (p.name || "").includes(s.workload)) }) })
		] });
	} else {
		const k3sN = tel.inventory.filter((n) => n.role !== "bastion").length;
		const readyK = tel.nodes.filter((n) => n.ready && n.id !== "bastion").length;
		const podN = Object.values(tel.podsByNode).reduce((s, a) => s + a.length, 0);
		kicker = "Cluster dossier";
		title = "JARVIS";
		body = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "kv",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "source" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: tel.source === "live" ? "LIVE scrape" : "SIMULATED (preview / no Prometheus)" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "hosts" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", { children: [
						readyK + 1,
						"/",
						k3sN + 1,
						" Ready (bastion is jump)"
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "flux" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: tel.fluxOk ? "ready" : "stalled" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "nfs" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: tel.nfsOk ? "nfs4 clients ok" : "degraded" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "etcd" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: tel.etcdOk ? "ctrl-01 leader" : "lost" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "k3s" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: tel.k3s }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "pods" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", { children: [podN, " running (Succeeded/Failed omitted)"] })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 mb-1 font-mono text-2xs uppercase tracking-[0.3em] text-accent",
				children: "Pods by node"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: tel.inventory.filter((n) => n.role !== "bastion").map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "grid grid-cols-[4.5rem_1fr] gap-2 border-b border-line py-1 font-mono text-xs",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "bg-transparent p-0 text-left text-accent",
					onClick: () => open("node", n.id),
					children: n.id
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [(tel.podsByNode[n.id] || []).length, " pods"] })]
			}, n.id)) })
		] });
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 z-50 grid grid-cols-1 md:grid-cols-[1fr_minmax(20rem,34rem)]",
		role: "dialog",
		"aria-modal": "true",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "bg-bg/55 backdrop-blur-sm",
			"aria-label": "Close dossier",
			onClick: close
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
			className: "dossier-enter flex max-h-dvh flex-col border-l border-line-s bg-panel shadow-dossier",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex flex-wrap items-start gap-2 border-b border-line px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-mono text-2xs uppercase tracking-[0.3em] text-accent",
						children: kicker
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-mono text-lg",
						children: title
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "min-h-11 rounded-xs border border-line px-2 py-1 font-mono text-2xs tracking-widest text-muted hover:border-accent hover:text-accent",
					onClick: close,
					"aria-label": "Close",
					children: "ESC"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-auto px-4 py-4 pb-8 text-sm",
				children: body
			})]
		})]
	});
}
function Clock() {
	const [now, setNow] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		setNow(Date.now());
		const id = window.setInterval(() => setNow(Date.now()), 1e3);
		return () => window.clearInterval(id);
	}, []);
	if (now == null) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("time", {
		className: "font-mono text-xs tabular-nums text-muted",
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
function ClientHud({ children }) {
	const [ready, setReady] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => setReady(true), []);
	if (!ready) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "relative z-1 px-6 py-16 font-mono text-xs uppercase tracking-[0.2em] text-accent",
		children: "acquiring telemetry…"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
function Shell({ children }) {
	const path = useRouterState({ select: (s) => s.location.pathname });
	const tel = useTelemetry();
	const readyK3s = tel.nodes.filter((n) => n.ready && n.id !== "bastion").length;
	const k3sN = tel.inventory.filter((n) => n.role !== "bastion").length;
	const hasB = tel.inventory.some((n) => n.role === "bastion");
	const ready = readyK3s + (hasB ? 1 : 0);
	const total = k3sN + (hasB ? 1 : 0);
	const live = tel.source === "live";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OverlayProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-bg text-fg hud-grid",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "scanlines pointer-events-none fixed inset-0 z-40",
				"aria-hidden": true
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "hexmark pointer-events-none",
				"aria-hidden": true
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "hud-frame",
				"aria-hidden": true,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "c tl" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "c tr" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "c bl" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "c br" })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "sticky top-0 z-20 border-b border-line bg-bg/90 shadow-hud backdrop-blur-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "scan-bar",
					"aria-hidden": true
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex max-w-7xl items-center gap-4 px-4 py-2.5 sm:px-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/",
							className: "flex min-h-11 items-center gap-2 text-fg no-underline",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hexagon, {
								className: "hex-glow size-5",
								strokeWidth: 1.6
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-sm font-medium tracking-[0.18em]",
								children: "JARVIS"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
							className: "ml-2 flex gap-0.5",
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
									className: on ? "flex min-h-11 items-center px-3 text-xs font-medium uppercase tracking-[0.14em] text-accent no-underline" : "flex min-h-11 items-center px-3 text-xs font-medium uppercase tracking-[0.14em] text-muted no-underline transition-colors duration-150 hover:text-fg",
									children: n.label
								}, n.to);
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "ml-auto flex items-center gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "hidden items-center gap-1.5 font-mono text-2xs tracking-widest text-muted sm:flex",
								suppressHydrationWarning: true,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: live ? "pulse-dot ok" : "pulse-dot" }),
									ready,
									"/",
									total,
									" ",
									live ? "LIVE" : "SIM"
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, {})]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClientHud, { children }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dossier, {})
		]
	}) });
}
//#endregion
export { Spark as a, useTelemetry as c, Shell as i, EventStream as n, fmtUptime as o, MetricBars as r, useOverlay as s, Bar as t };
