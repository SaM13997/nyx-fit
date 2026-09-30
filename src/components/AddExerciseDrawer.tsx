import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useId, useRef, useState } from "react";
import { AnimatedHeight } from "@/components/motion/AnimatedHeight";
import { Sheet } from "@/components/motion/Sheet";
import { springs } from "@/lib/motion";
import { WheelPicker } from "./wheel-picker";
import { Exercise, type WeightUnit } from "@/lib/types";
import {
  EXERCISE_CATEGORIES,
  formatExerciseCategory,
  inferExerciseCategory,
  type ExerciseCategory,
} from "@/lib/exerciseCategories";
import { convertWeightToLbs, formatWeight, formatWeightUnit, getWeightStep } from "@/lib/units";

interface AddExerciseDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSet: (
    exerciseName: string,
    category: ExerciseCategory,
    weight: number,
    reps: number
  ) => Promise<boolean>;
  unit: WeightUnit;
  exercises: Exercise[];
  isSaving?: boolean;
}

const COMMON_EXERCISES = [
  "Bench Press",
  "Squat",
  "Deadlift",
  "Overhead Press",
  "Pull Up",
  "Dumbbell Row",
  "Lateral Raise",
  "Bicep Curl",
  "Tricep Extension",
  "Leg Press",
];

const stepSwap = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0, transition: springs.smooth },
  exit: { opacity: 0, x: -24, transition: { duration: 0.14 } },
};

const REP_OPTIONS = Array.from({ length: 15 }, (_, i) => (i + 2).toString()); // 2 to 16

export function AddExerciseDrawer({
  isOpen,
  onClose,
  onAddSet,
  unit,
  exercises,
  isSaving = false,
}: AddExerciseDrawerProps) {
  const titleId = useId();
  const weightStep = getWeightStep(unit);
  const weightOptions = Array.from({ length: 80 }, (_, i) =>
    Math.round((i + 1) * weightStep * 10) / 10
  );
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [pickerExercise, setPickerExercise] = useState(COMMON_EXERCISES[0]);
  const [category, setCategory] = useState<ExerciseCategory>(inferExerciseCategory(COMMON_EXERCISES[0]));
  const [customName, setCustomName] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [weight, setWeight] = useState(weightOptions[8].toString());
  const [reps, setReps] = useState("8");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commitFailed, setCommitFailed] = useState(false);
  // Tracks a manual category override while typing a custom exercise name:
  // typing keeps re-inferring only until the user picks a category themselves.
  const categoryOverriddenRef = useRef(false);

  const handleAddSet = async () => {
    if (!selectedExercise || isSubmitting) return;
    setIsSubmitting(true);
    setCommitFailed(false);
    try {
      const saved = await onAddSet(
        selectedExercise,
        category,
        convertWeightToLbs(parseFloat(weight), unit),
        parseInt(reps)
      );
      if (!saved) {
        setCommitFailed(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentExerciseSetCount = selectedExercise
    ? exercises.find((e) => e.name === selectedExercise)?.sets.length || 0
    : 0;

  const candidateExercise = isCustomMode ? customName.trim() : pickerExercise;

  const searchTerm = searchQuery.trim().toLowerCase();
  const filteredExercises =
    !isCustomMode && searchTerm !== ""
      ? COMMON_EXERCISES.filter((name) =>
          name.toLowerCase().includes(searchTerm),
        )
      : null;

  const hasNoSearchMatches =
    filteredExercises !== null && filteredExercises.length === 0;

  const selectLabel = hasNoSearchMatches
    ? "No matching exercises"
    : candidateExercise
      ? `Select ${candidateExercise}`
      : "Select an exercise";

  const handleSearchSelect = (name: string) => {
    setPickerExercise(name);
    setCategory(inferExerciseCategory(name));
    categoryOverriddenRef.current = false;
    setSelectedExercise(name);
  };

  const resetState = () => {
    setSelectedExercise(null);
    setPickerExercise(COMMON_EXERCISES[0]);
    setCategory(inferExerciseCategory(COMMON_EXERCISES[0]));
    setCustomName("");
    setIsCustomMode(false);
    setSearchQuery("");
    setWeight(weightOptions[8].toString());
    setReps("8");
    setCommitFailed(false);
    categoryOverriddenRef.current = false;
  };

  return (
    <Sheet
      open={isOpen}
      onClose={onClose}
      onExitComplete={resetState}
      labelledBy={titleId}
      header={
        <div className="flex h-14 items-center justify-between border-b border-border px-4 pb-2">
          <div className="flex items-center gap-3">
            <AnimatePresence mode="popLayout" initial={false}>
              {selectedExercise ? (
                <motion.h2
                  key="selected"
                  id={titleId}
                  tabIndex={-1}
                  initial={{ opacity: 0, y: -8, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                  transition={springs.snappy}
                  className="block truncate text-xl font-bold text-foreground outline-none"
                >
                  {selectedExercise}
                </motion.h2>
              ) : (
                <motion.h2
                  key="default"
                  id={titleId}
                  tabIndex={-1}
                  initial={{ opacity: 0, y: -8, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                  transition={springs.snappy}
                  className="block truncate text-xl font-bold text-foreground outline-none"
                >
                  Add Exercise
                </motion.h2>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-3">
            {selectedExercise && (
              <motion.div
                key={currentExerciseSetCount}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={springs.pop}
                className="bg-brand-tint text-brand-ink px-3 py-1 rounded-full text-sm font-bold border border-brand-line"
              >
                {currentExerciseSetCount} sets
              </motion.div>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-fill-strong transition-colors hover:bg-line-strong active:scale-95"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      }
    >
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <AnimatedHeight innerClassName="p-6">
        <AnimatePresence mode="popLayout" initial={false}>
        {!selectedExercise ? (
          <motion.div
            key="pick"
            {...stepSwap}
            className="w-full flex flex-col items-center gap-6"
          >
            {isCustomMode ? (
              <input
                type="text"
                value={customName}
                maxLength={120}
                placeholder="e.g. Chest Supported Row"
                aria-label="Custom exercise name"
                onChange={(e) => {
                  const nextName = e.target.value;
                  setCustomName(nextName);
                  if (!categoryOverriddenRef.current) {
                    setCategory(inferExerciseCategory(nextName));
                  }
                }}
                className="w-full rounded-xl border border-border bg-background px-4 py-4 text-lg text-foreground outline-none transition focus:border-purple-600 dark:focus:border-purple-400"
              />
            ) : (
              <div className="w-full space-y-3">
                <input
                  type="text"
                  value={searchQuery}
                  placeholder="Search exercises"
                  aria-label="Search exercises"
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-4 text-lg text-foreground outline-none transition focus:border-purple-600 dark:focus:border-purple-400"
                />

                {filteredExercises === null ? (
                  <div className="relative h-48 w-full overflow-hidden">
                    <WheelPicker
                      options={COMMON_EXERCISES.map((ex) => ({
                        value: ex,
                        label: ex,
                      }))}
                      value={pickerExercise}
                      onValueChange={(val) => {
                        setPickerExercise(val);
                        setCategory(inferExerciseCategory(val));
                        categoryOverriddenRef.current = false;
                      }}
                    />
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-card via-transparent to-card" />
                  </div>
                ) : (
                  <div className="h-48 w-full space-y-2 overflow-y-auto">
                    {hasNoSearchMatches ? (
                      <p className="flex h-full items-center justify-center text-sm text-ink-subtle">
                        No exercises match that search.
                      </p>
                    ) : (
                      filteredExercises.map((name) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => handleSearchSelect(name)}
                          className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl bg-fill px-4 text-left transition-colors hover:bg-fill-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500"
                        >
                          <span className="font-medium text-foreground">{name}</span>
                          <span className="text-xs text-ink-subtle">
                            {formatExerciseCategory(inferExerciseCategory(name))}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                if (isCustomMode) {
                  setCategory(inferExerciseCategory(pickerExercise));
                } else {
                  setCategory(inferExerciseCategory(""));
                }
                categoryOverriddenRef.current = false;
                setCustomName("");
                setIsCustomMode((open) => !open);
              }}
              className="min-h-11 text-sm font-semibold text-brand-ink transition-colors hover:text-purple-700 dark:hover:text-purple-200"
            >
              {isCustomMode ? "Pick from the list instead" : "Type a custom exercise"}
            </button>

            <div className="w-full rounded-2xl border border-border bg-fill p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-subtle">
                    Category
                  </p>
                  <p className="text-sm text-ink-secondary">
                    Auto-selected from the exercise name.
                  </p>
                </div>
              </div>
              <select
                value={category}
                onChange={(e) => {
                  categoryOverriddenRef.current = true;
                  setCategory(e.target.value as ExerciseCategory);
                }}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-purple-600 dark:focus:border-purple-400"
              >
                {EXERCISE_CATEGORIES.map((option) => (
                  <option key={option} value={option}>
                    {formatExerciseCategory(option)}
                  </option>
                ))}
              </select>
            </div>

            <motion.button
              onClick={() => {
                const name = isCustomMode ? customName.trim() : pickerExercise;
                if (!name) return;
                setSelectedExercise(name);
              }}
              disabled={!candidateExercise || hasNoSearchMatches}
              className="w-full bg-brand hover:bg-brand-hover text-white rounded-xl py-4 font-bold text-lg transition-colors shadow-lg shadow-purple-900/20 disabled:opacity-50"
            >
              {selectLabel}
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="log"
            {...stepSwap}
            className="w-full flex flex-col gap-8"
          >
            <div className="flex justify-center gap-4">
              <div className="flex flex-col items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{formatWeightUnit(unit)}</span>
                <div className="relative h-40 w-32 overflow-hidden">
                  <WheelPicker
                    options={weightOptions.map((w) => ({
                      value: w.toString(),
                      label: formatWeight(convertWeightToLbs(w, unit), unit, unit === "kgs" ? 1 : 0),
                    }))}
                    value={weight}
                    onValueChange={(val) => setWeight(val)}
                  />
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-card/80 via-transparent to-card/80" />
                </div>
              </div>

              <div className="flex flex-col items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Reps</span>
                <div className="relative h-40 w-32 overflow-hidden">
                  <WheelPicker
                    options={REP_OPTIONS.map((r) => ({ value: r, label: r }))}
                    value={reps}
                    onValueChange={(val) => setReps(val)}
                  />
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-card/80 via-transparent to-card/80" />
                </div>
              </div>
            </div>

            {commitFailed ? (
              <p className="w-full rounded-xl border border-danger-ink/20 bg-danger-ink/10 px-3 py-2 text-center text-xs text-danger-ink">
                Couldn&apos;t save that set. Try again.
              </p>
            ) : null}

            <button
              onClick={handleAddSet}
              disabled={isSaving || isSubmitting}
              className="w-full bg-foreground text-background hover:bg-foreground/85 rounded-xl py-4 font-bold text-lg transition-colors shadow-lg active:scale-[0.98] disabled:opacity-50"
            >
              Log Set
            </button>
          </motion.div>
        )}
        </AnimatePresence>
        </AnimatedHeight>
      </div>
    </Sheet>
  );
}
