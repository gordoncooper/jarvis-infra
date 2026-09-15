export function fmtUptime(sec: number) {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${d}d ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`;
}

export function clockLabel(t: number) {
  const ms = t > 1e12 ? t : t * 1000;
  return new Date(ms).toISOString().slice(11, 19);
}
