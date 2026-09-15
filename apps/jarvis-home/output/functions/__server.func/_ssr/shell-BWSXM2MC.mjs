import { i as __toESM } from "../_runtime.mjs";
import { b as require_jsx_runtime, d as useRouterState, v as Link, z as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Hexagon, c as Activity } from "../_libs/lucide-react.mjs";
import { r as seedTelemetry } from "./router-HtY6Ax1-.mjs";
import { t as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/shell-BWSXM2MC.js
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
//#endregion
export { subscribeTelemetry as i, cn as n, getTelemetry as r, Shell as t };
