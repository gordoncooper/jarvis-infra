import { Link, useRouterState } from "@tanstack/react-router";
import { Hexagon } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { OverlayProvider } from "./overlay-context";
import { Dossier } from "./dossier";
import { useTelemetry } from "./use-telemetry";

function Clock() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  if (now == null) return <time className="font-mono text-xs tabular-nums text-muted">--:--:--</time>;
  const d = new Date(now);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return (
    <time className="font-mono text-xs tabular-nums text-muted" dateTime={d.toISOString()}>
      {hh}:{mm}:{ss}
    </time>
  );
}

function ClientHud({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) {
    return <p className="relative z-1 px-6 py-16 font-mono text-xs uppercase tracking-[0.2em] text-accent">acquiring telemetry…</p>;
  }
  return <>{children}</>;
}

export function Shell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const tel = useTelemetry();
  const readyK3s = tel.nodes.filter((n) => n.ready && n.id !== "bastion").length;
  const k3sN = tel.inventory.filter((n) => n.role !== "bastion").length;
  const hasB = tel.inventory.some((n) => n.role === "bastion");
  const ready = readyK3s + (hasB ? 1 : 0);
  const total = k3sN + (hasB ? 1 : 0);
  const live = tel.source === "live";

  return (
    <OverlayProvider>
      <div className="min-h-dvh bg-bg text-fg hud-grid">
        <div className="scanlines pointer-events-none fixed inset-0 z-40" aria-hidden />
        <div className="hexmark pointer-events-none" aria-hidden />
        <div className="hud-frame" aria-hidden>
          <i className="c tl" />
          <i className="c tr" />
          <i className="c bl" />
          <i className="c br" />
        </div>
        <header className="sticky top-0 z-20 border-b border-line bg-bg/90 shadow-hud backdrop-blur-sm">
          <div className="scan-bar" aria-hidden />
          <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-2.5 sm:px-6">
            <Link to="/" className="flex min-h-11 items-center gap-2 text-fg no-underline">
              <Hexagon className="hex-glow size-5" strokeWidth={1.6} />
              <span className="font-mono text-sm font-medium tracking-[0.18em]">JARVIS</span>
            </Link>
            <nav className="ml-2 flex gap-0.5" aria-label="Primary">
              {[
                { to: "/", label: "Home" },
                { to: "/status", label: "Status" },
              ].map((n) => {
                const on = path === n.to;
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    className={
                      on
                        ? "flex min-h-11 items-center px-3 text-xs font-medium uppercase tracking-[0.14em] text-accent no-underline"
                        : "flex min-h-11 items-center px-3 text-xs font-medium uppercase tracking-[0.14em] text-muted no-underline transition-colors duration-150 hover:text-fg"
                    }
                  >
                    {n.label}
                  </Link>
                );
              })}
            </nav>
            <div className="ml-auto flex items-center gap-4">
              <span className="hidden items-center gap-1.5 font-mono text-2xs tracking-widest text-muted sm:flex" suppressHydrationWarning>
                <span className={live ? "pulse-dot ok" : "pulse-dot"} />
                {ready}/{total} {live ? "LIVE" : "SIM"}
              </span>
              <Clock />
            </div>
          </div>
        </header>
        <ClientHud>{children}</ClientHud>
        <Dossier />
      </div>
    </OverlayProvider>
  );
}
