import { createFileRoute } from "@tanstack/react-router";
import { scrapeTelemetrySafe } from "@/lib/hud/live";

export const Route = createFileRoute("/api/telemetry")({
  server: {
    handlers: {
      GET: async () => {
        const body = await scrapeTelemetrySafe();
        return Response.json(body, {
          headers: { "cache-control": "no-store" },
        });
      },
    },
  },
});
