import { b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as ROLE_LABEL } from "./router-CsBJqbaI.mjs";
import { a as Spark, c as useTelemetry, i as Shell, n as EventStream, o as fmtUptime, s as useOverlay, t as Bar } from "./shell-DJayrTbX.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/status-25vd1OzS.js
var import_jsx_runtime = require_jsx_runtime();
function StatusView() {
	const tel = useTelemetry();
	const { open } = useOverlay();
	const liveOf = (id) => tel.nodes.find((n) => n.id === id);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "relative z-1 mx-auto max-w-7xl px-3 py-6 sm:px-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-mono text-2xs tracking-[0.3em] text-accent",
						children: "STATUS FLOOR"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
						className: "mt-1 font-mono text-xl tracking-tight sm:text-2xl",
						children: ["jarvis@", fmtUptime(tel.uptimeSec)]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 flex flex-wrap gap-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: tel.fluxOk ? "chip ok" : "chip bad",
								children: ["flux ", tel.fluxOk ? "ready" : "stalled"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: tel.nfsOk ? "chip ok" : "chip bad",
								children: ["nfs ", tel.nfsOk ? "nfs4" : "down"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: tel.etcdOk ? "chip ok" : "chip bad",
								children: ["etcd ", tel.etcdOk ? "leader" : "lost"]
							})
						]
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
					className: "ml-auto font-mono text-2xs leading-relaxed text-muted",
					children: `k3s ${tel.k3s}
prom  ${tel.source === "live" ? "LIVE scrape" : "SIMULATED"}
nfs   data-01:/cluster/nfs  ${tel.nfsOk ? "nfs4" : "down"}
etcd  ctrl-01  ${tel.etcdOk ? "leader" : "lost"}
flux  ${tel.fluxOk ? "ready" : "stalled"}`
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 grid gap-2 lg:grid-cols-2",
				children: tel.gpus.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "tile text-left",
					onClick: () => open("gpu", g.id),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between font-mono text-2xs tracking-widest text-muted",
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
							className: "mt-1 truncate font-mono text-2xs text-faint",
							children: g.uuid
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Spark, { values: tel.gpuHistory.map((h) => g.id === "gpu-01" ? h.gpu01 : h.gpu02) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, { pct: g.vramUsedMiB / (g.vramTotalMiB || 1) * 100 }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "sub",
							children: [
								g.vramUsedMiB.toFixed(0),
								" / ",
								g.vramTotalMiB.toFixed(0),
								" MiB VRAM · click for dossier"
							]
						})
					]
				}, g.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EventStream, { tel }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mb-2 font-mono text-2xs tracking-[0.28em] text-muted",
					children: "Workloads"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full border-collapse font-mono text-xs",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: [
						"NS",
						"NAME",
						"NODE",
						"READY"
					].map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "border-b border-line px-2 py-1.5 text-left text-2xs font-medium tracking-wider text-faint",
						children: h
					}, h)) }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: tel.workloads.map((w) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "cursor-pointer hover:text-accent",
						tabIndex: 0,
						onClick: () => open("node", w.node),
						onKeyDown: (e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								open("node", w.node);
							}
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border-b border-line px-2 py-1.5",
								children: w.ns
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border-b border-line px-2 py-1.5",
								children: w.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border-b border-line px-2 py-1.5",
								children: w.node
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border-b border-line px-2 py-1.5",
								children: w.ready
							})
						]
					}, `${w.ns}/${w.name}`)) })]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mb-2 font-mono text-2xs tracking-[0.28em] text-muted",
					children: "Nodes"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-x-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full min-w-[56rem] border-collapse font-mono text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: [
							"NODE",
							"ROLE",
							"IP",
							"CPU",
							"RAM",
							"DISK",
							"LOAD",
							"PODS",
							"KERNEL"
						].map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "border-b border-line px-2 py-1.5 text-left text-2xs font-medium tracking-wider text-faint",
							children: h
						}, h)) }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: tel.inventory.filter((n) => n.role !== "bastion").map((n) => {
							const st = liveOf(n.id);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "cursor-pointer hover:text-accent",
								tabIndex: 0,
								onClick: () => open("node", n.id),
								onKeyDown: (e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault();
										open("node", n.id);
									}
								},
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "border-b border-line px-2 py-1.5",
										children: n.id
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "border-b border-line px-2 py-1.5",
										children: ROLE_LABEL[n.role]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "border-b border-line px-2 py-1.5",
										children: n.ip
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "border-b border-line px-2 py-1.5",
										children: [st?.cpuPct?.toFixed(0) ?? "—", "%"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "border-b border-line px-2 py-1.5",
										children: [st?.ramPct?.toFixed(0) ?? "—", "%"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "border-b border-line px-2 py-1.5",
										children: [st?.diskPct?.toFixed(0) ?? "—", "%"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "border-b border-line px-2 py-1.5",
										children: st?.load?.toFixed(2) ?? "—"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "border-b border-line px-2 py-1.5",
										children: (tel.podsByNode[n.id] || []).length
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "border-b border-line px-2 py-1.5",
										children: st?.kernel || n.kernel
									})
								]
							}, n.id);
						}) })]
					})
				})]
			})
		]
	});
}
function StatusPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusView, {}) });
}
//#endregion
export { StatusPage as component };
