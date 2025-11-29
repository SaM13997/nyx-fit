import { Exercise } from "@/lib/types";
import { ChevronRight } from "lucide-react";

interface ExerciseItemProps {
  exercise: Exercise;
  onClick: () => void;
}

export function ExerciseItem({ exercise, onClick }: ExerciseItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-white/5 hover:bg-white/10 active:bg-white/15 rounded-2xl p-4 transition-colors text-left group"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg">{exercise.name}</h3>
          <p className="text-gray-400 text-sm mt-1">
            {exercise.sets.length} {exercise.sets.length === 1 ? "Set" : "Sets"}
          </p>
        </div>
        <ChevronRight className="h-5 w-5 text-gray-500 group-hover:text-white transition-colors" />
      </div>

      {/* Mini preview of sets */}
      {exercise.sets.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {exercise.sets.map((set, idx) => (
            <div
              key={set.id}
              className="bg-black/20 rounded-lg px-2 py-1 text-xs whitespace-nowrap text-gray-300"
            >
              <span className="font-medium text-white">{set.weight}</span> lbs × <span className="font-medium text-white">{set.reps}</span>
            </div>
          ))}
        </div>
      )}
    </button>
  );
}
