import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/stats")({
  component: StatsPage,
});

function StatsPage() {
  return (
    <div className="min-h-screen bg-black px-4 py-6 text-white">
      <h1 className="text-2xl font-bold">Statistics</h1>
      <div className="mt-8 p-4 border border-zinc-800 rounded-lg">
        <p>Statistics dashboard is coming soon.</p>
      </div>
    </div>
  );
}
