import { ROLE_LABEL } from "./inventory";
import { MetricBars } from "./bars";
import { EventStream } from "./events";
import { fmtUptime } from "./format";
import { useOverlay } from "./overlay-context";
import { useTelemetry } from "./use-telemetry";

export function HomeView() {
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
  const liveOf = (id: string) => tel.nodes.find((n) => n.id === id);

  return (
    <main className="relative z-1 mx-auto max-w-7xl px-4 py-5 pb-12 sm:px-6">
      <p className="mb-2 font-mono text-2xs uppercase tracking-[0.3em] text-accent">Command floor · systems online</p>
      <p className="mb-2 text-xs uppercase tracking-[0.16em] text-muted">LAN only · 192.168.8.0/24 · k3s single-server etcd</p>
      <h1 className="font-mono text-2xl leading-tight tracking-tight sm:text-3xl">
        Command for a six-node
        <br />
        inference lab.
      </h1>
      <div className="mt-3 flex flex-wrap gap-1">
        <span className={tel.fluxOk ? "chip ok" : "chip bad"}>flux {tel.fluxOk ? "ready" : "stalled"}</span>
        <span className={tel.nfsOk ? "chip ok" : "chip bad"}>nfs {tel.nfsOk ? "nfs4" : "down"}</span>
        <span className={tel.etcdOk ? "chip ok" : "chip bad"}>etcd {tel.etcdOk ? "leader" : "lost"}</span>
        <span className="chip">k3s {tel.k3s}</span>
        <span className="chip">{podN} pods</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <button type="button" className="tile" onClick={() => open("cluster", "cluster")}>
          <div className="lbl">Cluster</div>
          <div className="val">{live ? "LIVE" : "SIM"}</div>
          <div className="sub">
            {readyK + 1}/{k3sN + 1} hosts ready
          </div>
          <div className="hint">open dossier</div>
        </button>
        <button type="button" className="tile" onClick={() => open("cluster", "cluster")}>
          <div className="lbl">Uptime</div>
          <div className="val">{fmtUptime(tel.uptimeSec)}</div>
          <div className="sub">ctrl-01 etcd</div>
        </button>
        <button type="button" className="tile" onClick={() => open("gpu", "gpu-01")}>
          <div className="lbl">GPU-01 chat</div>
          <div className="val">{g1 ? `${g1.tempC.toFixed(0)}°C` : "—"}</div>
          <div className="sub">
            {g1
              ? `${(g1.vramUsedMiB / 1024).toFixed(1)} / ${(g1.vramTotalMiB / 1024).toFixed(1)} GiB · ${g1.utilPct.toFixed(0)}%`
              : "acquiring"}
          </div>
        </button>
        <button type="button" className="tile" onClick={() => open("gpu", "gpu-02")}>
          <div className="lbl">GPU-02 embed</div>
          <div className="val">{g2 ? `${g2.tempC.toFixed(0)}°C` : "—"}</div>
          <div className="sub">
            {g2 ? `${g2.vramUsedMiB.toFixed(0)} MiB nomic · ${g2.utilPct.toFixed(0)}%` : "acquiring"}
          </div>
        </button>
      </div>

      <EventStream tel={tel} />

      <section className="mt-5">
        <h2 className="mb-2 font-mono text-2xs tracking-[0.28em] text-muted">Services · TLS where marked · agent is hostPort</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {tel.services.map((s) => (
            <button key={s.id} type="button" className="tile" onClick={() => open("service", s.id)}>
              <div className="lbl">
                {s.name} · {s.tls ? "TLS" : "HTTP"}
              </div>
              <div className="val small">{s.href}</div>
              <div className="sub">{s.note}</div>
              <div className="hint">{s.host}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-5">
        <h2 className="mb-2 font-mono text-2xs tracking-[0.28em] text-muted">Rack · ThinkCentre M920x · 2.5G fabric</h2>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-6">
          {rack.map((n) => {
            const st = liveOf(n.id);
            const pods = tel.podsByNode[n.id] || [];
            return (
              <button key={n.id} type="button" className="tile" onClick={() => open("node", n.id)}>
                <div className="lbl">
                  <span className={st?.ready ? "dot" : "dot off"} /> {ROLE_LABEL[n.role] || n.role}
                </div>
                <div className="val small">{n.id}</div>
                <div className="sub">{n.ip}</div>
                <MetricBars cpuPct={st?.cpuPct} ramPct={st?.ramPct} diskPct={st?.diskPct} />
                <div className="hint">{pods.length} pods</div>
              </button>
            );
          })}
        </div>
        {bastion ? (
          <div className="mt-3 rounded-xs border border-dashed border-line-s px-3 py-2 font-mono text-xs text-muted">
            Uplink ·{" "}
            <button type="button" className="bg-transparent p-0 font-mono text-fg hover:text-accent" onClick={() => open("node", "bastion")}>
              {bastion.id} · {bastion.ip} · {bastion.cpu} · jump host, not scheduled
            </button>
          </div>
        ) : null}
      </section>
    </main>
  );
}
