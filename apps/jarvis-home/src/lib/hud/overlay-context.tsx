import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Overlay } from "./types";

type Ctx = {
  overlay: Overlay | null;
  open: (kind: Overlay["kind"], id: string) => void;
  close: () => void;
};

const OverlayCtx = createContext<Ctx | null>(null);

export function OverlayProvider({ children }: { children: ReactNode }) {
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const open = useCallback((kind: Overlay["kind"], id: string) => setOverlay({ kind, id }), []);
  const close = useCallback(() => setOverlay(null), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  const value = useMemo(() => ({ overlay, open, close }), [overlay, open, close]);
  return <OverlayCtx.Provider value={value}>{children}</OverlayCtx.Provider>;
}

export function useOverlay() {
  const ctx = useContext(OverlayCtx);
  if (!ctx) throw new Error("useOverlay outside provider");
  return ctx;
}
