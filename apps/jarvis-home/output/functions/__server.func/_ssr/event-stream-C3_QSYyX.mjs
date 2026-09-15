import { i as __toESM } from "../_runtime.mjs";
import { b as require_jsx_runtime, d as useRouterState, v as Link, z as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Hexagon, c as Activity, r as Radio } from "../_libs/lucide-react.mjs";
import { r as seedTelemetry } from "./router-D4XSGiua.mjs";
import { t as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/event-stream-C3_QSYyX.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var state = seedTelemetry("sim");
var listeners = /* @__PURE__ */ new Set();
var ticking = false;
function setState(next) {
	state = next;
	listeners.forEach((l) => l());
}
async function pull() {
	try {
		const r = await fetch("/api/telemetry", { cache: "no-store" });
		if (!r.ok) return;
		const next = await r.json();
		if (!next || !Array.isArray(next.gpus) || !Array.isArray(next.nodes)) return;
		setState(next);
	} catch {}
}
function subscribeTelemetry(fn) {
	listeners.add(fn);
	if (typeof window !== "undefined" && !ticking) {
		ticking = true;
		pull();
		window.setInterval(() => void pull(), 5e3);
	}
	return () => listeners.delete(fn);
}
function getTelemetry() {
	return state;
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
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, { className: cn("size-3", tel.source === "live" ? "text-ok" : "text-faint") }),
								tel.nodes.filter((n) => n.ready).length,
								"/",
								tel.nodes.length,
								" ",
								tel.source === "live" ? "LIVE" : "SIM"
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, {})]
					})
				]
			})
		}), children]
	});
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
function clock(t) {
	return new Date(t).toISOString().slice(11, 19);
}
function ago(t, now) {
	const s = Math.max(0, Math.round((now - t) / 1e3));
	if (s < 60) return `${s}s`;
	const m = Math.floor(s / 60);
	const r = s % 60;
	return r ? `${m}m${String(r).padStart(2, "0")}s` : `${m}m`;
}
function EventRow({ e, now }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
		className: "flex gap-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "w-[4.5rem] shrink-0 tabular-nums text-faint",
				title: new Date(e.t).toISOString(),
				children: clock(e.t)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: cn("w-10 shrink-0 uppercase tracking-wide", e.src === "flux" && "text-accent", e.src === "openclaw" && "text-ok", e.src === "prom" && "text-muted", e.src === "k8s" && "text-faint"),
				children: e.src === "openclaw" ? "claw" : e.src
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: cn("min-w-0 flex-1", e.lvl === "ok" && "text-ok", e.lvl === "warn" && "text-warn", e.lvl === "err" && "text-danger", e.lvl === "info" && "text-muted"),
				children: e.msg
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "hidden shrink-0 tabular-nums text-faint sm:inline",
				children: ago(e.t, now)
			})
		]
	});
}
function EventStream({ tel, compact = false }) {
	const [filter, setFilter] = (0, import_react.useState)("all");
	const now = tel.ts;
	const windowSec = tel.eventWindowSec || 600;
	const rows = (0, import_react.useMemo)(() => {
		const cutoff = now - windowSec * 1e3;
		return tel.events.filter((e) => e.t >= cutoff).filter((e) => filter === "all" ? true : e.src === filter).sort((a, b) => b.t - a.t);
	}, [
		tel.events,
		filter,
		now,
		windowSec
	]);
	const shown = compact ? rows.slice(0, 6) : rows;
	const minutes = Math.round(windowSec / 60);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: cn("rounded-md border border-line bg-bg/80 p-3", compact && "bg-bg-elev"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap items-end justify-between gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-muted",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Radio, {
					className: "size-3 text-accent",
					strokeWidth: 1.6
				}), "EVENT STREAM"]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 font-mono text-[10px] text-faint",
				children: [
					"last ",
					minutes,
					" min · ",
					rows.length,
					" event",
					rows.length === 1 ? "" : "s",
					tel.source === "live" ? " · cluster" : " · simulated"
				]
			})] }), !compact ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-1",
				role: "tablist",
				"aria-label": "Event source",
				children: FILTERS.map((f) => {
					const on = filter === f.id;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						role: "tab",
						"aria-selected": on,
						onClick: () => setFilter(f.id),
						className: cn("min-h-11 px-3 font-mono text-[10px] uppercase tracking-widest transition-colors duration-150", on ? "border border-accent/40 bg-accent/10 text-accent" : "border border-line text-muted hover:text-fg"),
						children: f.label
					}, f.id);
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/status",
				className: "font-mono text-[10px] tracking-widest text-accent no-underline hover:underline",
				children: "full floor"
			})]
		}), shown.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-3 font-mono text-[11px] text-faint",
			children: [
				"quiet — nothing in the last ",
				minutes,
				" minutes"
			]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: cn("mt-3 space-y-1.5 font-mono text-[11px]", !compact && "max-h-80 overflow-y-auto pr-1"),
			children: shown.map((e, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EventRow, {
				e,
				now
			}, `${e.t}-${e.src}-${e.msg}-${i}`))
		})]
	});
}
//#endregion
export { subscribeTelemetry as a, getTelemetry as i, Shell as n, cn as r, EventStream as t };
