import { i as __toESM } from "../_runtime.mjs";
import { b as require_jsx_runtime, v as Link, z as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as Lock, n as Server, o as Cpu, r as Radio, s as ArrowUpRight } from "../_libs/lucide-react.mjs";
import { a as ROLE_LABEL, i as NODES, n as formatUptime, o as SERVICES } from "./router-D4XSGiua.mjs";
import { a as subscribeTelemetry, i as getTelemetry, n as Shell, r as cn, t as EventStream } from "./event-stream-C3_QSYyX.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-0pt1ftrk.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var roleTone = {
	control: "border-accent/50",
	"gpu-chat": "border-accent",
	"gpu-embed": "border-accent/70",
	"storage-primary": "border-line-strong",
	"storage-replica": "border-line-strong",
	apps: "border-line-strong",
	bastion: "border-faint"
};
function Rack({ live }) {
	const compute = NODES.filter((n) => n.role !== "bastion");
	const bastion = NODES.find((n) => n.role === "bastion");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-2 sm:grid-cols-3 lg:grid-cols-6",
		children: [compute.map((n) => {
			const s = live?.[n.id];
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
				className: cn("rounded-lg border bg-bg-panel p-3", roleTone[n.role]),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-mono text-xs font-medium tracking-wide",
							children: n.id
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: cn("size-1.5 rounded-full", s?.ready === false ? "bg-danger" : "bg-ok"),
							"aria-hidden": true
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 font-mono text-[10px] tracking-widest text-muted",
						children: ROLE_LABEL[n.role]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 font-mono text-[10px] text-faint",
						children: n.ip
					}),
					s && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 h-1 overflow-hidden rounded-xs bg-bg",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-full bg-accent/80",
							style: { width: `${Math.min(100, s.cpuPct)}%` }
						})
					})
				]
			}, n.id);
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
			className: "rounded-lg border border-dashed border-line-strong bg-bg-elev p-3 sm:col-span-3 lg:col-span-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-mono text-[10px] tracking-widest text-muted",
				children: "UPLINK"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 font-mono text-xs",
				children: [
					bastion.id,
					" · ",
					bastion.ip,
					" · ",
					bastion.cpu,
					" · jump host, not scheduled"
				]
			})]
		})]
	});
}
function Home() {
	const tel = (0, import_react.useSyncExternalStore)(subscribeTelemetry, getTelemetry, getTelemetry);
	const live = Object.fromEntries(tel.nodes.map((n) => [n.id, n]));
	const g1 = tel.gpus[0];
	const g2 = tel.gpus[1];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-mono text-[10px] tracking-[0.28em] text-muted",
				children: "LAN ONLY · 192.168.8.0/24 · k3s SINGLE-SERVER ETCD"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "max-w-xl text-4xl font-medium leading-tight tracking-tight sm:text-5xl",
					children: "Command for a six-node inference lab."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/status",
					className: "inline-flex h-11 items-center gap-2 self-start border border-accent/40 bg-accent/10 px-4 font-mono text-xs tracking-[0.16em] text-accent no-underline hover:bg-accent/15",
					children: ["Open status floor", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, { className: "size-4" })]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						k: "cluster",
						v: tel.source === "live" ? "LIVE" : "SIM",
						sub: `${tel.nodes.filter((n) => n.ready).length}/7 hosts ready`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						k: "uptime",
						v: formatUptime(tel.uptimeSec),
						sub: "ctrl-01 etcd"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						k: "gpu-01 chat",
						v: `${g1.tempC.toFixed(0)}°C`,
						sub: `${(g1.vramUsedMiB / 1024).toFixed(1)} / 8.0 GiB`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						k: "gpu-02 embed",
						v: `${g2.tempC.toFixed(0)}°C`,
						sub: `${g2.vramUsedMiB.toFixed(0)} MiB nomic`
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "mt-8",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EventStream, {
					tel,
					compact: true
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-12",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {
					icon: Radio,
					title: "Services",
					hint: "TLS where marked · agent is hostPort"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5",
					children: SERVICES.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
						href: s.href,
						className: "group flex flex-col rounded-lg border border-line bg-bg-panel p-4 no-underline transition-colors duration-150 hover:border-accent/40",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium",
									children: s.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "flex items-center gap-1 font-mono text-[10px] text-muted",
									children: [s.tls ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "size-3" }) : null, s.host]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mt-2 font-mono text-[11px] text-muted",
								children: s.note
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mt-3 font-mono text-[10px] text-faint group-hover:text-accent",
								children: s.href
							})
						]
					}, s.id))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-12",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {
					icon: Server,
					title: "Rack",
					hint: "ThinkCentre M920x · 2.5G fabric"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Rack, { live })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-12 grid gap-3 lg:grid-cols-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "rounded-lg border border-line bg-bg-elev p-5 lg:col-span-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {
						icon: Cpu,
						title: "Plane",
						hint: "local-first · Grok on demand"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
						className: "mt-4 space-y-2 font-mono text-xs text-muted",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "jarvis-local — Ollama 7B Q6 on gpu-01 · electricity only" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "jarvis-embed — nomic-embed-text on gpu-02" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "jarvis-grok / jarvis-grok-code — xAI via LiteLLM · console.x.ai" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "GitOps: Gitea git.lan is origin · GitHub is mirror" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Never internet-exposed · mkcert LAN TLS on chat / home / grafana / llm" })
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "rounded-lg border border-line bg-bg-panel p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-mono text-[10px] tracking-[0.2em] text-muted",
							children: "OPERATOR"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-sm leading-relaxed text-muted",
							children: "Chat for conversation. Status floor for live counters. Agent (OpenClaw) when the cluster needs hands. Goose on the bastion for terminal work."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-4 font-mono text-[11px] text-faint",
							children: [
								"Flux ",
								tel.fluxOk ? "READY" : "DEGRADED",
								" · NFS ",
								tel.nfsOk ? "UP" : "DOWN",
								" · etcd ",
								tel.etcdOk ? "OK" : "FAULT",
								" · ",
								tel.source === "live" ? "PROM LIVE" : "PROM SIM"
							]
						})
					]
				})]
			})
		]
	}) });
}
function Header({ icon: Icon, title, hint }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-baseline justify-between gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
			className: "flex items-center gap-2 text-sm font-medium tracking-wide",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
				className: "size-4 text-accent",
				strokeWidth: 1.6
			}), title]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-mono text-[10px] tracking-widest text-faint",
			children: hint
		})]
	});
}
function Stat({ k, v, sub }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "rounded-lg border border-line bg-bg-panel px-4 py-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-mono text-[10px] tracking-[0.2em] text-muted",
				children: k.toUpperCase()
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 font-mono text-2xl tabular-nums tracking-tight",
				children: v
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 font-mono text-[11px] text-faint",
				children: sub
			})
		]
	});
}
//#endregion
export { Home as component };
