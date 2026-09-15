export function Spark({
  values,
}: {
  values: number[];
}) {
  const vals = values.filter(Number.isFinite);
  if (vals.length < 2) return null;
  const w = 320;
  const h = 88;
  const pad = 4;
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const xy = vals.map((v, i) => {
    const x = pad + (i / (vals.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / span) * (h - pad * 2);
    return [x, y] as const;
  });
  const line = xy.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${pad},${h - pad} ${line} ${xy[xy.length - 1][0].toFixed(1)},${h - pad}`;
  return (
    <svg className="h-spark w-full" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden>
      <polygon className="fill-accent/15" points={area} />
      <polyline fill="none" className="stroke-accent" strokeWidth="1.6" points={line} />
    </svg>
  );
}
