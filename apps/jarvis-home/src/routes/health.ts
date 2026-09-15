import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/health")({
  server: {
    handlers: {
      GET: async () =>
        Response.json(
          { status: true, app: "jarvis-home" },
          { headers: { "cache-control": "no-store" } },
        ),
    },
  },
});
