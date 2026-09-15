import type { ReactNode } from "react";
import { ROLE_LABEL } from "./inventory";
import { useOverlay } from "./overlay-context";
import { useTelemetry } from "./use-telemetry";
import { clockLabel } from "./format";
import { Spark } from "./spark";
import type { PodRow } from "./types";

function PodList({ pods }: { pods: PodRow[] }) {
  if (!pods.length) {
    return (
      <li className="grid grid-cols-[5.4rem_1fr_auto] gap-2 border-b border-line py-1 font-mono text-xs">
        <span className="text-faint">—</span>
        <span>none / not scheduled</span>
        <span />
      </li>
    );
  }
  return (
    <>
      {pods.map((p) => (
        <li
          key={`${p.ns}/${p.name}`}
          className="grid grid-cols-[5.4rem_1fr_auto] gap-2 border-b border-line py-1 font-mono text-xs"
        >
          <span className="text-faint">{p.ns}</span>
          <span>{p.name}</span>
          <span>
            {p.ready}
            {p.restarts ? <span className="text-warn"> r{p.restarts}</span> : null}
          </span>
        </li>
      ))}
    </>
  );
}

export function Dossier() {
  const { overlay, close, open } = useOverlay();
  const tel = useTelemetry();
  if (!overlay) return null;

  const inv = (id: string) => tel.inventory.find((n) => n.id === id);
  const live = (id: string) => tel.nodes.find((n) => n.id === id);
  const podsOn = (id: string) => tel.podsByNode[id] || [];

  let kicker = "";
  let title = "";
  let body: ReactNode = null;

  if (overlay.kind === "node") {
    const n = inv(overlay.id);
    const st = live(overlay.id);
    const pods = podsOn(overlay.id);
    const wls = tel.workloads.filter((w) => w.node === overlay.id);
    kicker = "Host dossier";
    title = n?.id || overlay.id;
    body = (
      <>
        <dl className="kv">
          <dt>role</dt>
          <dd>{ROLE_LABEL[n?.role || ""] || n?.role}</dd>
          <dt>ip</dt>
          <dd>{n?.ip}</dd>
          <dt>cpu</dt>
          <dd>
            {n?.cpu} · {n?.cores} threads · {st?.cpuPct?.toFixed(0) ?? "—"}%
          </dd>
          <dt>ram</dt>
          <dd>
            {n?.ramGiB} GiB · {st?.ramPct?.toFixed(0) ?? "—"}% used
          </dd>
          <dt>disk</dt>
          <dd>
            {n?.disk} · {st?.diskPct?.toFixed(0) ?? "—"}%
          </dd>
          <dt>load</dt>
          <dd>{st?.load?.toFixed(2) ?? "—"}</dd>
          <dt>kernel</dt>
          <dd>{st?.kernel || n?.kernel}</dd>
          <dt>kubelet</dt>
          <dd>{st?.kubelet || n?.k3s}</dd>
          <dt>runtime</dt>
          <dd>{st?.runtime || (n?.role === "bastion" ? "—" : "containerd")}</dd>
          <dt>os</dt>
          <dd>{st?.os || "—"}</dd>
          <dt>labels</dt>
          <dd>{(n?.labels || []).join(" ")}</dd>
          <dt>notes</dt>
          <dd>{n?.extra}</dd>
          <dt>ready</dt>
          <dd>{n?.role === "bastion" ? "jump (not a k3s node)" : st?.ready ? "Ready" : "NotReady"}</dd>
        </dl>
        {wls.length ? (
          <>
            <p className="mt-4 mb-1 font-mono text-2xs uppercase tracking-[0.3em] text-accent">Pinned workloads</p>
            <ul>
              {wls.map((w) => (
                <li key={w.name} className="grid grid-cols-[4.5rem_1fr] gap-2 border-b border-line py-1 font-mono text-xs">
                  <span className="text-faint">{w.ns}</span>
                  <span>
                    {w.name} · {w.ready}
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : null}
        <p className="mt-4 mb-1 font-mono text-2xs uppercase tracking-[0.3em] text-accent">
          Pods on {overlay.id} · {pods.length}
        </p>
        <ul>
          <PodList pods={pods} />
        </ul>
      </>
    );
  } else if (overlay.kind === "gpu") {
    const g = tel.gpus.find((x) => x.id === overlay.id) || tel.gpus[0];
    const n = inv(overlay.id);
    const key = overlay.id === "gpu-02" ? "gpu02" : "gpu01";
    kicker = "GPU dossier";
    title = overlay.id.toUpperCase();
    body = (
      <>
        <dl className="kv">
          <dt>sku</dt>
          <dd>RTX A1000 8 GiB</dd>
          <dt>temp</dt>
          <dd>{g.tempC.toFixed(1)} °C</dd>
          <dt>util</dt>
          <dd>{g.utilPct.toFixed(0)}%</dd>
          <dt>pstate</dt>
          <dd>{g.pstate}</dd>
          <dt>vram</dt>
          <dd>
            {g.vramUsedMiB.toFixed(0)} / {g.vramTotalMiB.toFixed(0)} MiB
          </dd>
          <dt>uuid</dt>
          <dd>{g.uuid}</dd>
          <dt>host</dt>
          <dd>
            {n?.ip} · {n?.extra}
          </dd>
        </dl>
        <Spark values={tel.gpuHistory.map((h) => (key === "gpu01" ? h.gpu01 : h.gpu02))} />
        <p className="mt-4 mb-1 font-mono text-2xs uppercase tracking-[0.3em] text-accent">Pods on {overlay.id}</p>
        <ul>
          <PodList pods={podsOn(overlay.id)} />
        </ul>
      </>
    );
  } else if (overlay.kind === "service") {
    const s = tel.services.find((x) => x.id === overlay.id);
    if (!s) return null;
    const w = tel.workloads.find((x) => x.name === s.workload);
    const evs = tel.events
      .filter((e) => (e.msg || "").includes(s.workload) || e.ns === s.ns)
      .slice(0, 8);
    kicker = "Service dossier";
    title = s.name;
    body = (
      <>
        <dl className="kv">
          <dt>url</dt>
          <dd>
            <a className="font-mono text-sm text-accent" href={s.href} target="_blank" rel="noreferrer">
              {s.href}
            </a>
          </dd>
          <dt>tls</dt>
          <dd>{s.tls ? "HTTPS" : "HTTP on purpose"}</dd>
          <dt>node</dt>
          <dd>
            <button type="button" className="bg-transparent p-0 font-mono text-accent" onClick={() => open("node", s.host)}>
              {s.host}
            </button>
          </dd>
          <dt>namespace</dt>
          <dd>{s.ns}</dd>
          <dt>workload</dt>
          <dd>
            {s.workload} · {w?.ready || "—"}
          </dd>
          <dt>note</dt>
          <dd>{s.note}</dd>
        </dl>
        <p className="mt-4 mb-1 font-mono text-2xs uppercase tracking-[0.3em] text-accent">Recent events</p>
        <ul>
          {evs.length
            ? evs.map((e, i) => (
                <li key={i} className="grid grid-cols-[4.5rem_3.2rem_1fr] gap-2 border-b border-line py-1 font-mono text-xs">
                  <span className="text-faint">{clockLabel(e.t)}</span>
                  <span className={`lvl-${e.lvl}`}>{e.src}</span>
                  <span>{e.msg}</span>
                </li>
              ))
            : (
                <li className="py-1 font-mono text-xs text-faint">none in window</li>
              )}
        </ul>
        <p className="mt-4 mb-1 font-mono text-2xs uppercase tracking-[0.3em] text-accent">Pods on {s.host}</p>
        <ul>
          <PodList
            pods={podsOn(s.host).filter((p) => p.ns === s.ns || (p.name || "").includes(s.workload))}
          />
        </ul>
      </>
    );
  } else {
    const k3sN = tel.inventory.filter((n) => n.role !== "bastion").length;
    const readyK = tel.nodes.filter((n) => n.ready && n.id !== "bastion").length;
    const podN = Object.values(tel.podsByNode).reduce((s, a) => s + a.length, 0);
    kicker = "Cluster dossier";
    title = "JARVIS";
    body = (
      <>
        <dl className="kv">
          <dt>source</dt>
          <dd>{tel.source === "live" ? "LIVE scrape" : "SIMULATED (preview / no Prometheus)"}</dd>
          <dt>hosts</dt>
          <dd>
            {readyK + 1}/{k3sN + 1} Ready (bastion is jump)
          </dd>
          <dt>flux</dt>
          <dd>{tel.fluxOk ? "ready" : "stalled"}</dd>
          <dt>nfs</dt>
          <dd>{tel.nfsOk ? "nfs4 clients ok" : "degraded"}</dd>
          <dt>etcd</dt>
          <dd>{tel.etcdOk ? "ctrl-01 leader" : "lost"}</dd>
          <dt>k3s</dt>
          <dd>{tel.k3s}</dd>
          <dt>pods</dt>
          <dd>{podN} running (Succeeded/Failed omitted)</dd>
        </dl>
        <p className="mt-4 mb-1 font-mono text-2xs uppercase tracking-[0.3em] text-accent">Pods by node</p>
        <ul>
          {tel.inventory
            .filter((n) => n.role !== "bastion")
            .map((n) => (
              <li key={n.id} className="grid grid-cols-[4.5rem_1fr] gap-2 border-b border-line py-1 font-mono text-xs">
                <button type="button" className="bg-transparent p-0 text-left text-accent" onClick={() => open("node", n.id)}>
                  {n.id}
                </button>
                <span>{(tel.podsByNode[n.id] || []).length} pods</span>
              </li>
            ))}
        </ul>
      </>
    );
  }

  return (
    <div className="fixed inset-0 z-50 grid grid-cols-1 md:grid-cols-[1fr_minmax(20rem,34rem)]" role="dialog" aria-modal="true">
      <button type="button" className="bg-bg/55 backdrop-blur-sm" aria-label="Close dossier" onClick={close} />
      <aside className="dossier-enter flex max-h-dvh flex-col border-l border-line-s bg-panel shadow-dossier">
        <header className="flex flex-wrap items-start gap-2 border-b border-line px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-2xs uppercase tracking-[0.3em] text-accent">{kicker}</p>
            <h2 className="font-mono text-lg">{title}</h2>
          </div>
          <button type="button" className="min-h-11 rounded-xs border border-line px-2 py-1 font-mono text-2xs tracking-widest text-muted hover:border-accent hover:text-accent" onClick={close} aria-label="Close">
            ESC
          </button>
        </header>
        <div className="overflow-auto px-4 py-4 pb-8 text-sm">{body}</div>
      </aside>
    </div>
  );
}
