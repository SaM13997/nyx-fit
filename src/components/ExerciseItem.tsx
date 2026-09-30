import { Exercise } from "@/lib/types";
import { ChevronRight } from "lucide-react";
import { formatExerciseCategory } from "@/lib/exerciseCategories";
import type { WeightUnit } from "@/lib/types";
import { formatWeight, formatWeightUnit } from "@/lib/units";
import { formatCountLabel } from "@/lib/utils";

interface ExerciseItemProps {
  exercise: Exercise;
  unit: WeightUnit;
  onClick: () => void;
}

export function ExerciseItem({ exercise, unit, onClick }: ExerciseItemProps) {
  const totalVolume = exercise.sets.reduce(
    (sum, set) => sum + set.weight * set.reps,
    0
  );
  return (
    <button
      onClick={onClick}
      className="w-full bg-fill hover:bg-fill-strong active:bg-line-strong rounded-2xl p-4 transition-colors text-left group"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-lg break-words">{exercise.name}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {exercise.category && (
              <span className="rounded-full border border-border bg-fill px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-secondary">
                {formatExerciseCategory(exercise.category)}
              </span>
            )}
            <p className="text-muted-foreground text-sm">
              {formatCountLabel(exercise.sets.length, "Set")}
              {totalVolume > 0
                ? ` • ${formatWeight(totalVolume, unit, 0)} ${formatWeightUnit(unit)} total`
                : null}
            </p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-ink-subtle group-hover:text-foreground transition-colors" />
      </div>

      {/* Mini preview of sets */}
      {exercise.sets.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {exercise.sets.map((set) => (
            <div
              key={set.id}
              className="bg-fill-strong rounded-lg px-2 py-1 text-xs whitespace-nowrap text-ink-secondary"
            >
              <span className="font-medium text-foreground">{formatWeight(set.weight, unit, 0)}</span> {formatWeightUnit(unit)} × <span className="font-medium text-foreground">{set.reps}</span>
            </div>
          ))}
        </div>
      )}
    </button>
  );
}
