import { useSyncExternalStore } from "react";
import { seedTelemetry } from "./seed";
import type { Telemetry } from "./types";

let state: Telemetry = seedTelemetry("sim");
const listeners = new Set<() => void>();
let ticking = false;

function emit() {
  listeners.forEach((l) => l());
}

async function pull() {
  try {
    const r = await fetch("/api/telemetry", { cache: "no-store" });
    if (!r.ok) return;
    const next = (await r.json()) as Telemetry;
    if (!next || !Array.isArray(next.gpus) || !Array.isArray(next.nodes)) return;
    state = next;
    emit();
  } catch {
    /* keep last */
  }
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  if (typeof window !== "undefined" && !ticking) {
    ticking = true;
    void pull();
    window.setInterval(() => void pull(), 5000);
  }
  return () => listeners.delete(fn);
}

export function useTelemetry(): Telemetry {
  return useSyncExternalStore(subscribe, () => state, () => state);
}
