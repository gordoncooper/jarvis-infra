import { createFileRoute } from "@tanstack/react-router";
import { HomeView } from "@/lib/hud/home-view";
import { Shell } from "@/lib/hud/shell";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <Shell>
      <HomeView />
    </Shell>
  );
}
