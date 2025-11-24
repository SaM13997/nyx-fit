import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/weight")({
  component: WeightPage,
});

function WeightPage() {
  return (
    <div className="min-h-screen bg-black px-4 py-6 text-white">
      <h1 className="text-2xl font-bold">Weight Tracker</h1>
      <div className="mt-8 p-4 border border-zinc-800 rounded-lg">
        <p>Weight tracking feature is coming soon.</p>
      </div>
    </div>
  );
}
