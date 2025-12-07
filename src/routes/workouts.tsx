import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Dumbbell } from "lucide-react";
import type { Workout } from "@/lib/types";
import { useWorkouts, useStartWorkout, useActiveWorkout } from "@/lib/convex/hooks";
import { WorkoutStatusCard } from "@/components/home";
import { WorkoutCard } from "@/components/WorkoutCard";
import { useState } from "react";

export const Route = createFileRoute("/workouts")({
  component: WorkoutsPage,
});

// !TODO: Redo the background of the padded area section with gemini 3 instead

// html,
// html:before{
//   --s: 56px; /* control the size */
//   --g: 10px; /* control the gap */
//   --c: #ECD078; /* first color */

//   --_l: #0000 calc(33% - .866*var(--g)),var(--c) calc(33.2% - .866*var(--g)) 33%,#0000 34%;
//   background:
//     repeating-linear-gradient(var(--c) 0 var(--g), #0000 0 50%)
//      0 calc(.866*var(--s) - var(--g)/2),
//     conic-gradient(from -150deg at var(--g) 50%,var(--c) 120deg,#0000 0),
//     linear-gradient(-120deg,var(--_l)),linear-gradient( -60deg,var(--_l))
//     #0B486B; /* second color */
//   background-size: var(--s) calc(3.466*var(--s));
//   animation: p infinite 2s linear;
// }
// html:before {
//   content: "";
//   position: fixed;
//   inset: 0;
//   -webkit-mask: 
//     linear-gradient(#000 50%,#0000 0) 
//     0 calc(.866*var(--s))/100% calc(3.466*var(--s));
//   animation-direction: reverse;
// }
// @keyframes p {
//   to {
//     background-position-x: calc(-1*var(--s));
//   }
// }

// use this animated background code to create the background for the  Visual Design Element - Top 35%.

// Change teh colors to match workout theme color and our design aesthetic:

// Add it behind a backdrop blur and fade from black to transparent from tl to br

function WorkoutsPage() {
  const navigate = useNavigate();
  const { workouts, isLoading } = useWorkouts();
  const { activeWorkout } = useActiveWorkout();
  const { startWorkout } = useStartWorkout();
  const [isStarting, setIsStarting] = useState(false);

  const handleStartWorkout = async () => {
    try {
      setIsStarting(true);
      const newWorkout = await startWorkout();
      navigate({ to: `/workout/${newWorkout.id}` });
    } catch (error) {
      console.error("Failed to start workout:", error);
      setIsStarting(false);
    }
  };

  return (
    <div className=" bg-black text-white font-sans relative">
      {/* Visual Design Element - Top 35% */}
      <div className="relative h-[35vh] pointer-events-none overflow-hidden">
        {/* Animated hexagonal pattern background */}
        <div className="absolute inset-0 animated-hex-bg opacity-50" />

        {/* Backdrop blur layer */}
        <div className="absolute inset-0 backdrop-blur-sm" />

        {/* Gradient fade from black (top-left) to transparent (bottom-right) */}
        <div className="absolute inset-0 bg-gradient-to-tr from-black via-black/60 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black h-10 to-transparent" />

        {/* Content */}
        <div className="relative flex flex-col justify-end  h-full px-4 pt-12">
          <div className=" max-w-md">
            <h1 className="text-6xl font-bold tracking-tighter ">
              Workouts
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative px-4 pb-24">
        <div className="mx-auto max-w-md space-y-6">
          <div className="px-1">
            <p className="text-sm text-zinc-400">
              Your training history and progress.
            </p>
          </div>

          <WorkoutStatusCard
            activeWorkout={activeWorkout ?? null}
            isStarting={isStarting}
            onStartWorkout={handleStartWorkout}
          />

          {isLoading ? (
            <div className="text-zinc-500 px-1">Loading workouts...</div>
          ) : (
            <WorkoutList workouts={workouts} />
          )}
        </div>
      </div>
    </div>
  );
}


function WorkoutList({ workouts }: { workouts: Workout[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 px-1">
        <h2 className="text-xl font-bold">Recent History</h2>
        <span className="bg-purple-500/20 text-purple-300 px-2.5 py-0.5 rounded-full text-xs font-bold border border-purple-500/20">
          {workouts.length}
        </span>
      </div>
      {workouts.length === 0 ? (
        <div className="border border-dashed border-purple-500/20 rounded-3xl p-12 text-center bg-purple-500/5">
          <div className="w-16 h-16 bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/20">
            <Dumbbell className="h-8 w-8 text-purple-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No workouts yet</h3>
          <p className="text-gray-400 text-sm max-w-[200px] mx-auto">
            Start your first workout to begin tracking your progress
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {workouts.map((workout, index) => (
            <WorkoutCard key={workout.id} workout={workout} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}

