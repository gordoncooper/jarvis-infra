import { ROLE_LABEL } from "./inventory";
import { Bar } from "./bars";
import { EventStream } from "./events";
import { fmtUptime } from "./format";
import { useOverlay } from "./overlay-context";
import { Spark } from "./spark";
import { useTelemetry } from "./use-telemetry";

export function StatusView() {
  const tel = useTelemetry();
  const { open } = useOverlay();
  const liveOf = (id: string) => tel.nodes.find((n) => n.id === id);

  return (
    <main className="relative z-1 mx-auto max-w-7xl px-3 py-6 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
        <div>
          <p className="font-mono text-2xs tracking-[0.3em] text-accent">STATUS FLOOR</p>
          <h1 className="mt-1 font-mono text-xl tracking-tight sm:text-2xl">jarvis@{fmtUptime(tel.uptimeSec)}</h1>
          <div className="mt-2 flex flex-wrap gap-1">
            <span className={tel.fluxOk ? "chip ok" : "chip bad"}>flux {tel.fluxOk ? "ready" : "stalled"}</span>
            <span className={tel.nfsOk ? "chip ok" : "chip bad"}>nfs {tel.nfsOk ? "nfs4" : "down"}</span>
            <span className={tel.etcdOk ? "chip ok" : "chip bad"}>etcd {tel.etcdOk ? "leader" : "lost"}</span>
          </div>
        </div>
        <pre className="ml-auto font-mono text-2xs leading-relaxed text-muted">
{`k3s ${tel.k3s}
prom  ${tel.source === "live" ? "LIVE scrape" : "SIMULATED"}
nfs   data-01:/cluster/nfs  ${tel.nfsOk ? "nfs4" : "down"}
etcd  ctrl-01  ${tel.etcdOk ? "leader" : "lost"}
flux  ${tel.fluxOk ? "ready" : "stalled"}`}
        </pre>
      </div>

      <div className="mt-4 grid gap-2 lg:grid-cols-2">
        {tel.gpus.map((g) => (
          <button key={g.id} type="button" className="tile text-left" onClick={() => open("gpu", g.id)}>
            <div className="flex items-center justify-between font-mono text-2xs tracking-widest text-muted">
              <span>{g.id.toUpperCase()} · RTX A1000</span>
              <span className="text-accent">
                {g.tempC.toFixed(1)}C · {g.utilPct.toFixed(0)}% · {g.pstate}
              </span>
            </div>
            <p className="mt-1 truncate font-mono text-2xs text-faint">{g.uuid}</p>
            <Spark values={tel.gpuHistory.map((h) => (g.id === "gpu-01" ? h.gpu01 : h.gpu02))} />
            <Bar pct={(g.vramUsedMiB / (g.vramTotalMiB || 1)) * 100} />
            <div className="sub">
              {g.vramUsedMiB.toFixed(0)} / {g.vramTotalMiB.toFixed(0)} MiB VRAM · click for dossier
            </div>
          </button>
        ))}
      </div>

      <EventStream tel={tel} />

      <section className="mt-5">
        <h2 className="mb-2 font-mono text-2xs tracking-[0.28em] text-muted">Workloads</h2>
        <table className="w-full border-collapse font-mono text-xs">
          <thead>
            <tr>
              {["NS", "NAME", "NODE", "READY"].map((h) => (
                <th key={h} className="border-b border-line px-2 py-1.5 text-left text-2xs font-medium tracking-wider text-faint">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tel.workloads.map((w) => (
              <tr
                key={`${w.ns}/${w.name}`}
                className="cursor-pointer hover:text-accent"
                tabIndex={0}
                onClick={() => open("node", w.node)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    open("node", w.node);
                  }
                }}
              >
                <td className="border-b border-line px-2 py-1.5">{w.ns}</td>
                <td className="border-b border-line px-2 py-1.5">{w.name}</td>
                <td className="border-b border-line px-2 py-1.5">{w.node}</td>
                <td className="border-b border-line px-2 py-1.5">{w.ready}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-5">
        <h2 className="mb-2 font-mono text-2xs tracking-[0.28em] text-muted">Nodes</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[56rem] border-collapse font-mono text-xs">
            <thead>
              <tr>
                {["NODE", "ROLE", "IP", "CPU", "RAM", "DISK", "LOAD", "PODS", "KERNEL"].map((h) => (
                  <th key={h} className="border-b border-line px-2 py-1.5 text-left text-2xs font-medium tracking-wider text-faint">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tel.inventory
                .filter((n) => n.role !== "bastion")
                .map((n) => {
                  const st = liveOf(n.id);
                  return (
                    <tr
                      key={n.id}
                      className="cursor-pointer hover:text-accent"
                      tabIndex={0}
                      onClick={() => open("node", n.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          open("node", n.id);
                        }
                      }}
                    >
                      <td className="border-b border-line px-2 py-1.5">{n.id}</td>
                      <td className="border-b border-line px-2 py-1.5">{ROLE_LABEL[n.role]}</td>
                      <td className="border-b border-line px-2 py-1.5">{n.ip}</td>
                      <td className="border-b border-line px-2 py-1.5">{st?.cpuPct?.toFixed(0) ?? "—"}%</td>
                      <td className="border-b border-line px-2 py-1.5">{st?.ramPct?.toFixed(0) ?? "—"}%</td>
                      <td className="border-b border-line px-2 py-1.5">{st?.diskPct?.toFixed(0) ?? "—"}%</td>
                      <td className="border-b border-line px-2 py-1.5">{st?.load?.toFixed(2) ?? "—"}</td>
                      <td className="border-b border-line px-2 py-1.5">{(tel.podsByNode[n.id] || []).length}</td>
                      <td className="border-b border-line px-2 py-1.5">{st?.kernel || n.kernel}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
