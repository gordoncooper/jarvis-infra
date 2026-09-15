import { b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as ROLE_LABEL } from "./router-CsBJqbaI.mjs";
import { c as useTelemetry, i as Shell, n as EventStream, o as fmtUptime, r as MetricBars, s as useOverlay } from "./shell-DJayrTbX.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-Dr5vpiM9.js
var import_jsx_runtime = require_jsx_runtime();
function HomeView() {
	const tel = useTelemetry();
	const { open } = useOverlay();
	const live = tel.source === "live";
	const k3sN = tel.inventory.filter((n) => n.role !== "bastion").length;
	const readyK = tel.nodes.filter((n) => n.ready && n.id !== "bastion").length;
	const g1 = tel.gpus[0];
	const g2 = tel.gpus[1];
	const rack = tel.inventory.filter((n) => n.role !== "bastion");
	const bastion = tel.inventory.find((n) => n.role === "bastion");
	const podN = Object.values(tel.podsByNode).reduce((s, a) => s + a.length, 0);
	const liveOf = (id) => tel.nodes.find((n) => n.id === id);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "relative z-1 mx-auto max-w-7xl px-4 py-5 pb-12 sm:px-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-2 font-mono text-2xs uppercase tracking-[0.3em] text-accent",
				children: "Command floor · systems online"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-2 text-xs uppercase tracking-[0.16em] text-muted",
				children: "LAN only · 192.168.8.0/24 · k3s single-server etcd"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
				className: "font-mono text-2xl leading-tight tracking-tight sm:text-3xl",
				children: [
					"Command for a six-node",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
					"inference lab."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex flex-wrap gap-1",
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
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "chip",
						children: ["k3s ", tel.k3s]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "chip",
						children: [podN, " pods"]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "tile",
						onClick: () => open("cluster", "cluster"),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "lbl",
								children: "Cluster"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "val",
								children: live ? "LIVE" : "SIM"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "sub",
								children: [
									readyK + 1,
									"/",
									k3sN + 1,
									" hosts ready"
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "hint",
								children: "open dossier"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "tile",
						onClick: () => open("cluster", "cluster"),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "lbl",
								children: "Uptime"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "val",
								children: fmtUptime(tel.uptimeSec)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "sub",
								children: "ctrl-01 etcd"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "tile",
						onClick: () => open("gpu", "gpu-01"),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "lbl",
								children: "GPU-01 chat"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "val",
								children: g1 ? `${g1.tempC.toFixed(0)}°C` : "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "sub",
								children: g1 ? `${(g1.vramUsedMiB / 1024).toFixed(1)} / ${(g1.vramTotalMiB / 1024).toFixed(1)} GiB · ${g1.utilPct.toFixed(0)}%` : "acquiring"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "tile",
						onClick: () => open("gpu", "gpu-02"),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "lbl",
								children: "GPU-02 embed"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "val",
								children: g2 ? `${g2.tempC.toFixed(0)}°C` : "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "sub",
								children: g2 ? `${g2.vramUsedMiB.toFixed(0)} MiB nomic · ${g2.utilPct.toFixed(0)}%` : "acquiring"
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EventStream, { tel }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mb-2 font-mono text-2xs tracking-[0.28em] text-muted",
					children: "Services · TLS where marked · agent is hostPort"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5",
					children: tel.services.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "tile",
						onClick: () => open("service", s.id),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "lbl",
								children: [
									s.name,
									" · ",
									s.tls ? "TLS" : "HTTP"
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "val small",
								children: s.href
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "sub",
								children: s.note
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "hint",
								children: s.host
							})
						]
					}, s.id))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mb-2 font-mono text-2xs tracking-[0.28em] text-muted",
						children: "Rack · ThinkCentre M920x · 2.5G fabric"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-2 gap-2 lg:grid-cols-6",
						children: rack.map((n) => {
							const st = liveOf(n.id);
							const pods = tel.podsByNode[n.id] || [];
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "tile",
								onClick: () => open("node", n.id),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "lbl",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: st?.ready ? "dot" : "dot off" }),
											" ",
											ROLE_LABEL[n.role] || n.role
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "val small",
										children: n.id
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "sub",
										children: n.ip
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricBars, {
										cpuPct: st?.cpuPct,
										ramPct: st?.ramPct,
										diskPct: st?.diskPct
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "hint",
										children: [pods.length, " pods"]
									})
								]
							}, n.id);
						})
					}),
					bastion ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 rounded-xs border border-dashed border-line-s px-3 py-2 font-mono text-xs text-muted",
						children: [
							"Uplink ·",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "bg-transparent p-0 font-mono text-fg hover:text-accent",
								onClick: () => open("node", "bastion"),
								children: [
									bastion.id,
									" · ",
									bastion.ip,
									" · ",
									bastion.cpu,
									" · jump host, not scheduled"
								]
							})
						]
					}) : null
				]
			})
		]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HomeView, {}) });
}
//#endregion
export { Home as component };
