export function Bar({ pct }: { pct: number }) {
  const n = Math.max(0, Math.min(100, pct || 0));
  return (
    <div className="h-bar bg-line overflow-hidden rounded-full">
      <i className="block h-full bg-accent" style={{ width: `${n.toFixed(0)}%` }} />
    </div>
  );
}

export function MetricBars({
  cpuPct,
  ramPct,
  diskPct,
}: {
  cpuPct?: number;
  ramPct?: number;
  diskPct?: number;
}) {
  const rows: [string, number | undefined][] = [
    ["cpu", cpuPct],
    ["ram", ramPct],
    ["disk", diskPct],
  ];
  return (
    <div className="mt-1.5 grid gap-1">
      {rows.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[2.4rem_1fr_auto] items-center gap-1.5 font-mono text-2xs text-faint">
          <span>{k}</span>
          <Bar pct={v ?? 0} />
          <span>{v == null ? "—" : `${v.toFixed(0)}%`}</span>
        </div>
      ))}
    </div>
  );
}
