import { useState } from "react";
import { clockLabel } from "./format";
import type { EventSrc, Telemetry } from "./types";

const FILTERS: { id: "all" | EventSrc; label: string }[] = [
  { id: "all", label: "all" },
  { id: "flux", label: "flux" },
  { id: "k8s", label: "k8s" },
  { id: "openclaw", label: "claw" },
  { id: "prom", label: "prom" },
];

export function EventStream({ tel }: { tel: Telemetry }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const items = tel.events.filter((e) => filter === "all" || e.src === filter);
  return (
    <section className="mt-4 rounded-xs border border-line bg-elev">
      <header className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2">
        <h2 className="font-mono text-2xs font-medium tracking-[0.2em] text-muted">
          Event stream · last 10 min · {items.length} shown
        </h2>
        <div className="ml-auto flex gap-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={
                filter === f.id
                  ? "rounded-xs border border-accent/50 px-1.5 py-0.5 font-mono text-2xs uppercase tracking-wider text-accent"
                  : "rounded-xs border border-line px-1.5 py-0.5 font-mono text-2xs uppercase tracking-wider text-muted"
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </header>
      <ul className="elog max-h-60 overflow-auto font-mono text-xs">
        {items.slice(0, 40).map((e, i) => (
          <li key={`${e.t}-${i}`} className="grid grid-cols-[4.5rem_3.2rem_1fr] gap-2 border-b border-line px-3 py-1.5 max-sm:grid-cols-[3.6rem_1fr]">
            <span className="text-faint">{clockLabel(e.t)}</span>
            <span className={`uppercase tracking-wide max-sm:hidden lvl-${e.lvl}`}>{e.src}</span>
            <span>{e.msg}</span>
          </li>
        ))}
        {items.length === 0 ? (
          <li className="grid grid-cols-[4.5rem_1fr] gap-2 px-3 py-2 text-faint">
            <span>—</span>
            <span>no events</span>
          </li>
        ) : null}
      </ul>
    </section>
  );
}
