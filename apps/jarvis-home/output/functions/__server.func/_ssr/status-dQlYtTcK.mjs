import { i as __toESM } from "../_runtime.mjs";
import { b as require_jsx_runtime, z as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as WORKLOADS, c as getTelemetry, i as Shell, l as subscribeTelemetry, n as ROLE_LABEL, o as cn, s as formatUptime, t as NODES } from "./shell-DQaP3aRL.mjs";
import { a as ResponsiveContainer, i as Area, n as YAxis, o as Tooltip, r as XAxis, t as AreaChart } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/status-dQlYtTcK.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Status() {
	const tel = (0, import_react.useSyncExternalStore)(subscribeTelemetry, getTelemetry, getTelemetry);
	const byId = (0, import_react.useMemo)(() => Object.fromEntries(tel.nodes.map((n) => [n.id, n])), [tel.nodes]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, {
		denser: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "scanlines pointer-events-none absolute inset-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "relative mx-auto min-h-[calc(100dvh-3.5rem)] max-w-7xl px-3 py-6 sm:px-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-mono text-[10px] tracking-[0.3em] text-accent",
							children: "STATUS FLOOR"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
							className: "mt-1 font-mono text-xl tracking-tight sm:text-2xl",
							children: ["jarvis@", formatUptime(tel.uptimeSec)]
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
							className: "font-mono text-[10px] leading-relaxed text-muted",
							children: `k3s ${NODES[0].k3s}
flux  main@54bf0a5  ${tel.fluxOk ? "True" : "False"}
nfs   data-01:/cluster/nfs  ${tel.nfsOk ? "nfs4" : "down"}
etcd  ctrl-01  ${tel.etcdOk ? "leader" : "lost"}`
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						className: "mt-5 grid gap-2 lg:grid-cols-2",
						children: tel.gpus.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
							className: "rounded-md border border-line bg-bg-elev/90 p-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between font-mono text-[10px] tracking-widest text-muted",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [g.id.toUpperCase(), " · RTX A1000"] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-accent",
										children: [
											g.tempC.toFixed(1),
											"C · ",
											g.utilPct.toFixed(0),
											"% · ",
											g.pstate
										]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 truncate font-mono text-[10px] text-faint",
									children: g.uuid
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-3 h-24",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
										width: "100%",
										height: "100%",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AreaChart, {
											data: tel.gpuHistory,
											margin: {
												top: 4,
												right: 0,
												left: 0,
												bottom: 0
											},
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
													dataKey: "t",
													hide: true
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
													domain: [40, 80],
													hide: true
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { contentStyle: {
													background: "#0e1216",
													border: "1px solid #2a3844",
													fontFamily: "IBM Plex Mono, monospace",
													fontSize: 11,
													color: "#e8edf2"
												} }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Area, {
													type: "monotone",
													dataKey: g.id === "gpu-01" ? "gpu01" : "gpu02",
													stroke: "#5eead4",
													fill: "#5eead4",
													fillOpacity: .12,
													strokeWidth: 1.4,
													isAnimationActive: false,
													name: "temp C"
												})
											]
										})
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meter, {
									label: "VRAM",
									value: g.vramUsedMiB / g.vramTotalMiB,
									text: `${g.vramUsedMiB.toFixed(0)} / ${g.vramTotalMiB} MiB`
								})
							]
						}, g.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						className: "mt-4 overflow-x-auto",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
							className: "w-full min-w-[720px] border-collapse font-mono text-[11px]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "text-left text-[10px] tracking-widest text-faint",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "border-b border-line py-2 pr-3 font-medium",
										children: "NODE"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "border-b border-line py-2 pr-3 font-medium",
										children: "ROLE"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "border-b border-line py-2 pr-3 font-medium",
										children: "IP"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "border-b border-line py-2 pr-3 font-medium",
										children: "CPU"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "border-b border-line py-2 pr-3 font-medium",
										children: "RAM"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "border-b border-line py-2 pr-3 font-medium",
										children: "DISK"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "border-b border-line py-2 pr-3 font-medium",
										children: "LOAD"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "border-b border-line py-2 font-medium",
										children: "KERNEL"
									})
								]
							}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: NODES.map((n) => {
								const s = byId[n.id];
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
									className: "text-fg",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "border-b border-line py-2 pr-3 text-accent",
											children: n.id
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "border-b border-line py-2 pr-3 text-muted",
											children: ROLE_LABEL[n.role]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "border-b border-line py-2 pr-3 tabular-nums",
											children: n.ip
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "border-b border-line py-2 pr-3",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MiniBar, { pct: s?.cpuPct ?? 0 })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "border-b border-line py-2 pr-3",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MiniBar, { pct: s?.ramPct ?? 0 })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "border-b border-line py-2 pr-3",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MiniBar, { pct: s?.diskPct ?? 0 })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "border-b border-line py-2 pr-3 tabular-nums text-muted",
											children: (s?.load ?? 0).toFixed(2)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "border-b border-line py-2 text-faint",
											children: n.kernel
										})
									]
								}, n.id);
							}) })]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "mt-4 grid gap-3 lg:grid-cols-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
							className: "rounded-md border border-line bg-bg-elev/90 p-3 lg:col-span-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-mono text-[10px] tracking-[0.2em] text-muted",
								children: "WORKLOADS"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "mt-2 divide-y divide-line font-mono text-[11px]",
								children: WORKLOADS.map((w) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "flex flex-wrap items-center gap-x-3 py-1.5",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-faint",
											children: w.ns
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: w.name }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "ml-auto text-muted",
											children: w.node
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-ok",
											children: w.ready
										})
									]
								}, w.ns + w.name))
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
							className: "rounded-md border border-line bg-bg/80 p-3 lg:col-span-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-mono text-[10px] tracking-[0.2em] text-muted",
								children: "EVENT STREAM"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "mt-2 space-y-1.5 font-mono text-[11px]",
								children: tel.events.map((e, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "flex gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "shrink-0 tabular-nums text-faint",
										children: new Date(e.t).toISOString().slice(11, 19)
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: cn(e.lvl === "ok" && "text-ok", e.lvl === "warn" && "text-warn", e.lvl === "info" && "text-muted"),
										children: e.msg
									})]
								}, e.t + e.msg + i))
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "mt-4 rounded-md border border-line bg-bg-elev/80 p-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-mono text-[10px] tracking-[0.2em] text-muted",
							children: "PROC / INVENTORY"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
							className: "mt-2 overflow-x-auto font-mono text-[10px] leading-relaxed text-muted",
							children: NODES.map((n) => `${n.id.padEnd(10)} ${n.ip.padEnd(15)} ${n.cpu.padEnd(14)} ${String(n.cores).padStart(2)}c  ${String(n.ramGiB).padStart(2)}G  ${n.extra}`).join("\n")
						})]
					})
				]
			})]
		})
	});
}
function MiniBar({ pct }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: "inline-flex items-center gap-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "inline-block h-1 w-16 overflow-hidden rounded-xs bg-bg",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "block h-full bg-accent",
				style: { width: `${Math.min(100, pct)}%` }
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "w-8 tabular-nums text-muted",
			children: [pct.toFixed(0), "%"]
		})]
	});
}
function Meter({ label, value, text }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex justify-between font-mono text-[10px] text-muted",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: text })]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-1 h-1 overflow-hidden rounded-xs bg-bg",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "h-full bg-accent",
				style: { width: `${Math.min(100, value * 100)}%` }
			})
		})]
	});
}
//#endregion
export { Status as component };
