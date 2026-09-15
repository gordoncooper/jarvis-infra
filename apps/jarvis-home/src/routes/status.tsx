import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/lib/hud/shell";
import { StatusView } from "@/lib/hud/status-view";

export const Route = createFileRoute("/status")({ component: StatusPage });

function StatusPage() {
  return (
    <Shell>
      <StatusView />
    </Shell>
  );
}
