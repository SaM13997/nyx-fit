import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/workout/$id")({
  component: WorkoutPage,
});

function WorkoutPage() {
  const { id } = Route.useParams();

  return (
    <div className="min-h-screen bg-black px-4 py-6 text-white">
      <h1 className="text-2xl font-bold">Workout Details</h1>
      <p className="text-zinc-400">Workout ID: {id}</p>
      <div className="mt-8 p-4 border border-zinc-800 rounded-lg">
        <p>Workout detail view is coming soon.</p>
      </div>
    </div>
  );
}
