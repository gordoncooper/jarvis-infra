import { i as __toESM } from "../_runtime.mjs";
import { _ as createRootRoute, b as require_jsx_runtime, g as createFileRoute, h as lazyRouteComponent, l as Scripts, m as Outlet, p as createRouter, u as HeadContent, y as useRouter, z as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as TriangleAlert } from "../_libs/lucide-react.mjs";
import { a as union, i as string, n as number, r as object, t as literal } from "../_libs/zod.mjs";
import { request } from "node:https";
import { readFileSync } from "node:fs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-CsBJqbaI.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var FALLBACK_MESSAGE = "An unexpected error occurred. Try reloading the page.";
function errorMessage(error) {
	if (error instanceof Error && error.message) return error.message;
	if (typeof error === "string" && error) return error;
	return FALLBACK_MESSAGE;
}
function AppErrorComponent({ error }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-red-500",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					className: "size-10",
					strokeWidth: 2
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-lg font-semibold",
				children: "Something went wrong"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-md text-sm break-words text-zinc-500 dark:text-zinc-400",
				children: errorMessage(error)
			})
		]
	});
}
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
var CONNECTOR_TOKEN_READY_EVENT = "grok:connector-token-ready";
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = object({
	channel: literal(PREVIEW_BRIDGE_CHANNEL),
	version: number().int().positive(),
	type: string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: literal("navigate"),
	path: string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: literal("history"),
	delta: union([literal(-1), literal(1)])
});
var ConnectorTokenReadySchema = EnvelopeSchema.extend({ type: literal("connector-token-ready") });
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Origin of the Grok embedder framing this page, or null when the page runs
* top-level (download/export, local `npm run dev`, deployed sites) or under a
* non-Grok parent. Client-only; null during SSR.
*/
function resolveCurrentEmbedderOrigin() {
	if (typeof window === "undefined") return null;
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	return resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	const parentOrigin = resolveCurrentEmbedderOrigin();
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onHello = (data) => {
		if (!HelloSchema.safeParse(data).success) return;
		announce();
	};
	const onNavigate = (data) => {
		const parsed = NavigateSchema.safeParse(data);
		if (!parsed.success) return;
		navigate(parsed.data.path);
		queueMicrotask(reportLocation);
	};
	const onHistory = (data) => {
		const parsed = HistorySchema.safeParse(data);
		if (!parsed.success) return;
		if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
		window.history.go(parsed.data.delta);
	};
	const onConnectorTokenReady = (data) => {
		if (!ConnectorTokenReadySchema.safeParse(data).success) return;
		window.dispatchEvent(new Event(CONNECTOR_TOKEN_READY_EVENT));
	};
	const hostMessageHandlers = /* @__PURE__ */ new Map([
		["hello", onHello],
		["navigate", onNavigate],
		["history", onHistory],
		["connector-token-ready", onConnectorTokenReady]
	]);
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		hostMessageHandlers.get(envelope.data.type)?.(event.data);
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function PreviewHostBridge() {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	return null;
}
var styles_default = "/assets/styles-BGPURQXl.css";
var APP_NAME = "JARVIS";
var Route$4 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: APP_NAME },
			{
				name: "theme-color",
				content: "#07090b"
			},
			{
				name: "description",
				content: "JARVIS command center — six-node inference lab HUD."
			}
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "manifest",
				href: "/__grok/manifest.webmanifest"
			},
			{
				rel: "apple-touch-icon",
				href: "/__grok/icon-180.png"
			}
		]
	}),
	component: () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
		] })]
	})
});
var $$splitComponentImporter$1 = () => import("./routes-Dr5vpiM9.mjs");
var Route$3 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
var Route$2 = createFileRoute("/health")({ server: { handlers: { GET: async () => Response.json({
	status: true,
	app: "jarvis-home"
}, { headers: { "cache-control": "no-store" } }) } } });
var $$splitComponentImporter = () => import("./status-25vd1OzS.mjs");
var Route$1 = createFileRoute("/status")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
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
		extra: "Open WebUI · LiteLLM · Piper · OpenClaw · homepage",
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
		tls: true,
		ns: "apps",
		workload: "open-webui"
	},
	{
		id: "agent",
		name: "Agent",
		href: "http://agent.lan:18789",
		note: "OpenClaw gateway · hostPort 18789",
		host: "apps-01",
		tls: false,
		ns: "agents",
		workload: "openclaw"
	},
	{
		id: "grafana",
		name: "Grafana",
		href: "https://grafana.lan",
		note: "NVIDIA 14574 · node exporters",
		host: "data-02",
		tls: true,
		ns: "monitoring",
		workload: "grafana"
	},
	{
		id: "git",
		name: "Gitea",
		href: "http://git.lan",
		note: "Flux origin · stays HTTP",
		host: "ctrl-01",
		tls: false,
		ns: "gitea",
		workload: "gitea"
	},
	{
		id: "llm",
		name: "LiteLLM",
		href: "https://llm.lan/v1",
		note: "jarvis-local · grok · grok-code",
		host: "apps-01",
		tls: true,
		ns: "inference",
		workload: "litellm"
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
var BOOT_MS = Date.parse("2026-09-03T16:00:00-07:00");
var SIM_PODS = {
	"ctrl-01": [
		{
			ns: "gitea",
			name: "gitea-6d9cff854f-qhkwc",
			phase: "Running",
			ready: "1/1",
			restarts: 1
		},
		{
			ns: "flux-system",
			name: "kustomize-controller-6d959d5f65-kj8hk",
			phase: "Running",
			ready: "1/1",
			restarts: 2
		},
		{
			ns: "flux-system",
			name: "source-controller-645ff9f8b9-tlhg4",
			phase: "Running",
			ready: "1/1",
			restarts: 1
		},
		{
			ns: "flux-system",
			name: "helm-controller-7c8d9f4b6-xk2n4",
			phase: "Running",
			ready: "1/1",
			restarts: 1
		},
		{
			ns: "kube-system",
			name: "traefik-59b7647586-7g246",
			phase: "Running",
			ready: "1/1",
			restarts: 1
		},
		{
			ns: "kube-system",
			name: "coredns-54996dc9b4-xtzgk",
			phase: "Running",
			ready: "1/1",
			restarts: 1
		},
		{
			ns: "kube-system",
			name: "local-path-provisioner-77c8d6b4f-m2q9c",
			phase: "Running",
			ready: "1/1",
			restarts: 0
		},
		{
			ns: "monitoring",
			name: "node-exporter-ctrl",
			phase: "Running",
			ready: "1/1",
			restarts: 0
		}
	],
	"gpu-01": [
		{
			ns: "inference",
			name: "ollama-5b95745686-j8blj",
			phase: "Running",
			ready: "1/1",
			restarts: 0
		},
		{
			ns: "kube-system",
			name: "nvidia-device-plugin-9bjv9",
			phase: "Running",
			ready: "1/1",
			restarts: 0
		},
		{
			ns: "monitoring",
			name: "nvidia-gpu-exporter-2qs8p",
			phase: "Running",
			ready: "1/1",
			restarts: 0
		},
		{
			ns: "monitoring",
			name: "node-exporter-gpu01",
			phase: "Running",
			ready: "1/1",
			restarts: 0
		}
	],
	"gpu-02": [
		{
			ns: "inference",
			name: "ollama-embed-5cc579ccfb-p58px",
			phase: "Running",
			ready: "1/1",
			restarts: 0
		},
		{
			ns: "kube-system",
			name: "nvidia-device-plugin-tx8zt",
			phase: "Running",
			ready: "1/1",
			restarts: 0
		},
		{
			ns: "monitoring",
			name: "nvidia-gpu-exporter-8gl5v",
			phase: "Running",
			ready: "1/1",
			restarts: 0
		},
		{
			ns: "monitoring",
			name: "node-exporter-gpu02",
			phase: "Running",
			ready: "1/1",
			restarts: 0
		}
	],
	"data-01": [{
		ns: "monitoring",
		name: "node-exporter-j47pv",
		phase: "Running",
		ready: "1/1",
		restarts: 0
	}],
	"data-02": [
		{
			ns: "monitoring",
			name: "prometheus-56cbcdc467-8tvrw",
			phase: "Running",
			ready: "1/1",
			restarts: 0
		},
		{
			ns: "monitoring",
			name: "grafana-c587749b6-zk9nm",
			phase: "Running",
			ready: "1/1",
			restarts: 0
		},
		{
			ns: "monitoring",
			name: "kube-state-metrics-f4b87d8d4-6nxwg",
			phase: "Running",
			ready: "1/1",
			restarts: 0
		},
		{
			ns: "monitoring",
			name: "node-exporter-data02",
			phase: "Running",
			ready: "1/1",
			restarts: 0
		}
	],
	"apps-01": [
		{
			ns: "apps",
			name: "homepage-54ffb5d6d7-9t74f",
			phase: "Running",
			ready: "1/1",
			restarts: 0
		},
		{
			ns: "apps",
			name: "open-webui-88bf56d4b-gwsbj",
			phase: "Running",
			ready: "1/1",
			restarts: 0
		},
		{
			ns: "apps",
			name: "piper-86f7d4cfb4-kvj2f",
			phase: "Running",
			ready: "1/1",
			restarts: 0
		},
		{
			ns: "agents",
			name: "openclaw-5db6bcccf5-mwbd7",
			phase: "Running",
			ready: "1/1",
			restarts: 0
		},
		{
			ns: "inference",
			name: "litellm-579c5c948b-d9hdn",
			phase: "Running",
			ready: "1/1",
			restarts: 0
		},
		{
			ns: "monitoring",
			name: "node-exporter-apps01",
			phase: "Running",
			ready: "1/1",
			restarts: 0
		}
	]
};
function seedTelemetry(source = "sim", now = Date.now()) {
	const originSec = Math.floor(now / 1e3);
	const events = [
		{
			t: now - 8e3,
			src: "flux",
			lvl: "ok",
			ns: "flux-system",
			reason: "ReconciliationSucceeded",
			msg: "Kustomization/flux-system Applied revision: main@sha1:946bad4"
		},
		{
			t: now - 14e3,
			src: "flux",
			lvl: "ok",
			ns: "flux-system",
			reason: "ArtifactUpToDate",
			msg: "GitRepository/flux-system stored artifact for revision main@sha1:946bad4"
		},
		{
			t: now - 28e3,
			src: "prom",
			lvl: "ok",
			ns: "monitoring",
			reason: "Scrape",
			msg: "nvidia-gpu-exporter 2/2 Ready"
		},
		{
			t: now - 41e3,
			src: "prom",
			lvl: "ok",
			ns: "monitoring",
			reason: "Scrape",
			msg: "node-exporter 6/6 Ready"
		},
		{
			t: now - 55e3,
			src: "k8s",
			lvl: "ok",
			ns: "apps",
			reason: "Started",
			msg: "pod/open-webui-88bf56d4b-gwsbj Container started"
		},
		{
			t: now - 72e3,
			src: "k8s",
			lvl: "ok",
			ns: "inference",
			reason: "Pulled",
			msg: "pod/ollama-5b95745686-j8blj Successfully pulled image"
		},
		{
			t: now - 95e3,
			src: "openclaw",
			lvl: "info",
			ns: "agents",
			reason: "Ready",
			msg: "deployment/openclaw gateway listening :18789"
		},
		{
			t: now - 14e4,
			src: "k8s",
			lvl: "ok",
			ns: "gitea",
			reason: "Scheduled",
			msg: "pod/gitea-6d9cff854f-qhkwc Assigned to ctrl-01"
		},
		{
			t: now - 18e4,
			src: "prom",
			lvl: "ok",
			ns: "monitoring",
			reason: "Scrape",
			msg: "prometheus scrape loop ok · 18s"
		},
		{
			t: now - 24e4,
			src: "flux",
			lvl: "ok",
			ns: "flux-system",
			reason: "Ready",
			msg: "Kustomization/apps Healthy"
		}
	];
	return {
		ts: now,
		source,
		uptimeSec: Math.floor((now - BOOT_MS) / 1e3),
		fluxOk: true,
		nfsOk: true,
		etcdOk: true,
		k3s: K3S_VERSION,
		nodes: NODES.map((n) => ({
			id: n.id,
			cpuPct: n.role === "bastion" ? 3 : n.id === "gpu-01" ? 8 : 4,
			ramPct: n.id === "gpu-01" ? 22 : n.role === "bastion" ? 28 : 8,
			diskPct: n.id.startsWith("gpu") ? 25 : n.id === "apps-01" ? 18 : 14,
			load: n.role === "bastion" ? .2 : n.id === "ctrl-01" ? .2 : .08,
			ready: true,
			kernel: n.kernel,
			kubelet: n.k3s,
			os: "Ubuntu 26.04.1 LTS",
			runtime: n.role === "bastion" ? "—" : "containerd://2.3.4-k3s1.36"
		})),
		gpus: [{
			id: "gpu-01",
			tempC: 68,
			utilPct: 2,
			vramUsedMiB: 6007,
			vramTotalMiB: 8188,
			pstate: "P8",
			uuid: GPU_UUID["gpu-01"]
		}, {
			id: "gpu-02",
			tempC: 60,
			utilPct: 0,
			vramUsedMiB: 1,
			vramTotalMiB: 8188,
			pstate: "P8",
			uuid: GPU_UUID["gpu-02"]
		}],
		gpuHistory: Array.from({ length: 36 }, (_, i) => ({
			t: originSec - (35 - i) * 30,
			gpu01: 67.2 + Math.sin(i / 5) * 1.1,
			gpu02: 59.4 + Math.cos(i / 6) * .8,
			util01: Math.max(0, 3 + Math.sin(i / 3) * 4),
			util02: Math.max(0, .4 + Math.cos(i / 4) * .6)
		})),
		events,
		eventWindowSec: 600,
		workloads: WORKLOADS.map((w) => ({ ...w })),
		services: SERVICES.map((s) => ({ ...s })),
		podsByNode: Object.fromEntries(Object.entries(SIM_PODS).map(([k, v]) => [k, v.map((p) => ({ ...p }))])),
		inventory: NODES
	};
}
var SA = "/var/run/secrets/kubernetes.io/serviceaccount";
var WINDOW_MS = 6e5;
var DEFAULT_PROM = "http://prometheus.monitoring.svc:9090";
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
	if (!host) return Promise.reject(/* @__PURE__ */ new Error("not in cluster"));
	const token = readFileSync(`${SA}/token`, "utf8").trim();
	const ca = readFileSync(`${SA}/ca.crt`);
	return new Promise((resolve, reject) => {
		const req = request({
			hostname: host,
			port,
			path,
			method: "GET",
			ca,
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: "application/json"
			},
			timeout: timeoutMs
		}, (res) => {
			const chunks = [];
			res.on("data", (c) => chunks.push(c));
			res.on("end", () => {
				const body = Buffer.concat(chunks).toString("utf8");
				if ((res.statusCode ?? 500) >= 400) {
					reject(/* @__PURE__ */ new Error(`k8s ${res.statusCode} ${path}`));
					return;
				}
				try {
					resolve(JSON.parse(body));
				} catch (err) {
					reject(err);
				}
			});
		});
		req.on("timeout", () => {
			req.destroy();
			reject(/* @__PURE__ */ new Error("k8s timeout"));
		});
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
		t,
		src: classifySrc(ns, kind, name),
		lvl: classifyLvl(ev.type || "Normal", reason),
		ns: ns || void 0,
		reason,
		msg: `${obj} ${msgCore}${count}`.slice(0, 180)
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
			t,
			src: "flux",
			lvl: ok ? "ok" : c.type === "Ready" ? "err" : "warn",
			ns,
			reason,
			msg: `${kind}/${name} ${msg}`.slice(0, 180)
		});
	}
	return out;
}
function dedupe(events) {
	const seen = /* @__PURE__ */ new Set();
	const out = [];
	for (const e of events.sort((a, b) => b.t - a.t)) {
		const key = `${e.src}|${e.reason}|${e.msg}|${Math.floor(e.t / 15e3)}`;
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
			k8sGet("/api/v1/events?limit=250", 2e3),
			k8sGet("/apis/kustomize.toolkit.fluxcd.io/v1/kustomizations", 2e3),
			k8sGet("/apis/source.toolkit.fluxcd.io/v1/gitrepositories", 2e3)
		]);
		const gathered = [];
		if (evWrap.status === "fulfilled") for (const ev of evWrap.value.items ?? []) {
			const row = fromCoreEvent(ev, now);
			if (row) gathered.push(row);
		}
		if (ksWrap.status === "fulfilled") for (const it of ksWrap.value.items ?? []) gathered.push(...fromFlux("Kustomization", it, now));
		if (gitWrap.status === "fulfilled") for (const it of gitWrap.value.items ?? []) gathered.push(...fromFlux("GitRepository", it, now));
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
				ns,
				name,
				phase,
				ready: `${readyN}/${css.length || 1}`,
				restarts
			});
		}
		for (const k of Object.keys(by)) by[k].sort((a, b) => a.ns.localeCompare(b.ns) || a.name.localeCompare(b.name));
		return by;
	} catch {
		return empty;
	}
}
async function collectNodeFacts() {
	const out = {};
	if (!process.env.KUBERNETES_SERVICE_HOST) return out;
	try {
		const wrap = await k8sGet("/api/v1/nodes", 2e3);
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
				ready: cond?.status === "True"
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
	const m = /* @__PURE__ */ new Map();
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
var Q = {
	gpuTemp: "nvidia_smi_temperature_gpu",
	gpuUtil: "nvidia_smi_utilization_gpu",
	gpuMemUsed: "nvidia_smi_memory_used_bytes",
	gpuMemTotal: "nvidia_smi_memory_total_bytes",
	gpuInfo: "nvidia_smi_gpu_info",
	gpuPstate: "nvidia_smi_pstate",
	cpu: "100 * (1 - avg by (instance) (rate(node_cpu_seconds_total{mode=\"idle\"}[2m])))",
	ram: "100 * (1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)",
	disk: "100 * (1 - node_filesystem_avail_bytes{mountpoint=\"/\",fstype!~\"tmpfs|overlay|squashfs|nsfs\"} / node_filesystem_size_bytes{mountpoint=\"/\",fstype!~\"tmpfs|overlay|squashfs|nsfs\"})",
	load: "node_load1",
	boot: "node_boot_time_seconds",
	nodeUp: "up{job=\"node-exporter\"}",
	gpuUp: "up{job=\"nvidia-gpu-exporter\"}",
	nfs: "count(node_filesystem_size_bytes{mountpoint=\"/mnt/nfs\"})",
	flux: "kube_deployment_status_replicas_available{namespace=\"flux-system\",deployment=\"kustomize-controller\"}",
	depReady: "kube_deployment_status_replicas_available",
	depSpec: "kube_deployment_spec_replicas"
};
function pstateLabel(v) {
	if (!Number.isFinite(v) || v < 0) return "P8";
	return `P${Math.round(v)}`;
}
async function scrapePrometheus() {
	const inCluster = Boolean(process.env.KUBERNETES_SERVICE_HOST);
	const explicit = process.env.PROMETHEUS_URL;
	const base = (explicit ?? DEFAULT_PROM).replace(/\/$/, "");
	if (!base || base === "off" || !inCluster && !explicit) return seedTelemetry("sim", Date.now());
	const [gpuTemp, gpuUtil, gpuMemUsed, gpuMemTotal, gpuInfo, gpuPstate, cpu, ram, disk, load, boot, nodeUp, gpuUp, nfs, flux, depReady, depSpec, podsByNode, nodeFacts] = await Promise.all([
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
		collectNodeFacts()
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
			uuid: info?.metric.uuid || prev.uuid
		};
	});
	const nodes = NODES.map((n) => {
		const facts = nodeFacts[n.id] || {};
		const prev = fallback.nodes.find((s) => s.id === n.id);
		if (n.role === "bastion") return {
			...prev,
			ready: true,
			kernel: n.kernel,
			kubelet: "—"
		};
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
			runtime: facts.runtime || ""
		};
	});
	const readyKey = (ns, name) => `${ns}/${name}`;
	const ready = /* @__PURE__ */ new Map();
	const spec = /* @__PURE__ */ new Map();
	for (const r of depReady) ready.set(readyKey(r.metric.namespace ?? "", r.metric.deployment ?? ""), Number(r.value[1]));
	for (const r of depSpec) spec.set(readyKey(r.metric.namespace ?? "", r.metric.deployment ?? ""), Number(r.value[1]));
	const workloads = WORKLOADS.map((w) => {
		const k = readyKey(w.ns, w.name);
		const av = ready.get(k);
		const sp = spec.get(k);
		if (av == null || sp == null) return w;
		return {
			...w,
			ready: `${av}/${sp}`
		};
	});
	const ctrlBoot = num(bootMap.get("ctrl-01"), 0);
	const uptimeSec = ctrlBoot > 0 ? Math.max(0, Math.floor(now / 1e3 - ctrlBoot)) : fallback.uptimeSec;
	const end = Math.floor(now / 1e3);
	const start = end - 1080;
	let gpuHistory = fallback.gpuHistory;
	try {
		const [h1, h2, hu1, hu2] = await Promise.all([
			queryRange(base, "nvidia_smi_temperature_gpu{instance=\"gpu-01\"}", start, end, 30, 2500),
			queryRange(base, "nvidia_smi_temperature_gpu{instance=\"gpu-02\"}", start, end, 30, 2500),
			queryRange(base, "nvidia_smi_utilization_gpu{instance=\"gpu-01\"}", start, end, 30, 2500),
			queryRange(base, "nvidia_smi_utilization_gpu{instance=\"gpu-02\"}", start, end, 30, 2500)
		]);
		const a = h1[0]?.values ?? [];
		const b = h2[0]?.values ?? [];
		const c = hu1[0]?.values ?? [];
		const d = hu2[0]?.values ?? [];
		const n = Math.max(a.length, b.length, c.length, d.length);
		if (n > 2) gpuHistory = Array.from({ length: n }, (_, i) => ({
			t: Number(a[i]?.[0] ?? b[i]?.[0] ?? start + i * 30),
			gpu01: Number(a[i]?.[1] ?? gpus[0].tempC),
			gpu02: Number(b[i]?.[1] ?? gpus[1].tempC),
			util01: Number(c[i]?.[1] ?? gpus[0].utilPct),
			util02: Number(d[i]?.[1] ?? gpus[1].utilPct)
		}));
	} catch {}
	const gpuExportersUp = gpuUp.filter((r) => Number(r.value[1]) === 1).length;
	const nodeExportersUp = nodeUp.filter((r) => Number(r.value[1]) === 1).length;
	const nfsClients = num(nfs[0], 0);
	const fluxOk = num(flux[0], 0) >= 1;
	let events = await collectClusterEvents(now);
	if (events.length === 0) events = [{
		t: now,
		src: "prom",
		lvl: gpuExportersUp === 2 ? "ok" : "warn",
		ns: "monitoring",
		reason: "Scrape",
		msg: `nvidia-gpu-exporter ${gpuExportersUp}/2 Ready`
	}, {
		t: now - 1e3,
		src: "prom",
		lvl: nodeExportersUp >= 6 ? "ok" : "warn",
		ns: "monitoring",
		reason: "Scrape",
		msg: `node-exporter ${nodeExportersUp}/6`
	}];
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
		inventory: NODES
	};
}
async function scrapeTelemetrySafe() {
	try {
		return await Promise.race([scrapePrometheus(), new Promise((_, rej) => setTimeout(() => rej(/* @__PURE__ */ new Error("prometheus scrape timeout")), 4e3))]);
	} catch {
		const sim = seedTelemetry("sim", Date.now());
		const livePods = await collectPodsByNode();
		if (Object.keys(livePods).length) sim.podsByNode = livePods;
		return sim;
	}
}
var Route = createFileRoute("/api/telemetry")({ server: { handlers: { GET: async () => {
	const body = await scrapeTelemetrySafe();
	return Response.json(body, { headers: { "cache-control": "no-store" } });
} } } });
var rootRouteChildren = {
	IndexRoute: Route$3.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$4
	}),
	HealthRoute: Route$2.update({
		id: "/health",
		path: "/health",
		getParentRoute: () => Route$4
	}),
	StatusRoute: Route$1.update({
		id: "/status",
		path: "/status",
		getParentRoute: () => Route$4
	}),
	ApiTelemetryRoute: Route.update({
		id: "/api/telemetry",
		path: "/api/telemetry",
		getParentRoute: () => Route$4
	})
};
var routeTree = Route$4._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { seedTelemetry as n, ROLE_LABEL as r, router_exports as t };
