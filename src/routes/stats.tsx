import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/lib/route-auth";

export const Route = createFileRoute("/stats")({
  beforeLoad: ({ context, location }) => {
    requireAuth({ context, location });
  },
  component: StatsPage,
});

function StatsPage() {
  return (
    <div className="min-h-screen bg-black px-4 py-6 pb-page-nav text-white overflow-x-hidden">
      <h1 className="text-2xl font-bold">Statistics</h1>
      <div className="mt-8 p-4 border border-zinc-800 rounded-lg">
        <p>Statistics dashboard is coming soon.</p>
      </div>
    </div>
  );
}
