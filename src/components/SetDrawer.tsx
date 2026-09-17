import { WorkoutSet, Workout, type WeightUnit } from "@/lib/types";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, Minus, Plus, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { formatWeight, formatWeightUnit, getWeightStep } from "@/lib/units";

const DEFAULT_REP_DECREMENT = 2;
const MAX_WEIGHT = 100000;
const MAX_REPS = 10000;

type SetField = "weight" | "reps";

type SetDraft = {
  setId: string;
  field: SetField;
  text: string;
};

interface SetDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseId: string;
  unit: WeightUnit;
  workout: Workout;
  onUpdate: (exerciseId: string, sets: WorkoutSet[]) => Promise<boolean>;
  isSaving?: boolean;
}

const clampFieldValue = (value: number, field: SetField): number =>
  field === "reps"
    ? Math.min(MAX_REPS, Math.max(0, Math.round(value)))
    : Math.min(MAX_WEIGHT, Math.max(0, value));

const SAVE_FAILED_MESSAGE = "Couldn't save that change.";
const REMOTE_CHANGE_MESSAGE =
  "This workout changed elsewhere. Your unsaved edit was discarded.";

export function SetDrawer({
  isOpen,
  onClose,
  exerciseId,
  unit,
  workout,
  onUpdate,
  isSaving = false,
}: SetDrawerProps) {
  const exercise = workout.exercises.find((e) => e.id === exerciseId);
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [draft, setDraft] = useState<SetDraft | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commitError, setCommitError] = useState<string | null>(null);
  const submittingRef = useRef(false);
  const revisionRef = useRef(workout.revision);
  const weightStep = getWeightStep(unit);

  useEffect(() => {
    if (exercise) {
      setSets(exercise.sets);
    }
  }, [exercise]);

  useEffect(() => {
    if (revisionRef.current === workout.revision) return;
    revisionRef.current = workout.revision;

    if (draft !== null) {
      setCommitError(REMOTE_CHANGE_MESSAGE);
    }

    setDraft(null);
  }, [draft, workout.revision]);

  if (!exercise) return null;

  const controlsDisabled = isSaving || isSubmitting;

  const runSubmit = async (nextSets: WorkoutSet[]) => {
    if (submittingRef.current) return;

    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      const saved = await onUpdate(exerciseId, nextSets);

      if (saved) {
        setSets(nextSets);
        setDraft(null);
        setCommitError(null);
      } else {
        setCommitError(SAVE_FAILED_MESSAGE);
      }
    } catch (e) {
      console.error("Failed to save set change:", e);
      setCommitError(SAVE_FAILED_MESSAGE);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const commitFieldValue = (setId: string, field: SetField, value: number) => {
    const nextSets = sets.map((set) =>
      set.id === setId ? { ...set, [field]: clampFieldValue(value, field) } : set
    );
    void runSubmit(nextSets);
  };

  const handleAddSet = () => {
    const lastSet = sets[sets.length - 1];
    const newSet: WorkoutSet = {
      id: uuidv4(),
      weight: lastSet ? lastSet.weight : 0,
      reps: lastSet ? lastSet.reps : 0,
    };
    void runSubmit([...sets, newSet]);
  };

  const handleAddIncrementedSet = () => {
    const lastSet = sets[sets.length - 1];

    if (!lastSet) {
      handleAddSet();
      return;
    }

    const newSet: WorkoutSet = {
      id: uuidv4(),
      weight: clampFieldValue(lastSet.weight + weightStep, "weight"),
      reps: Math.max(0, lastSet.reps - DEFAULT_REP_DECREMENT),
    };
    void runSubmit([...sets, newSet]);
  };

  const handleDuplicateLastSet = () => {
    const lastSet = sets[sets.length - 1];

    if (!lastSet) {
      return;
    }

    const duplicatedSet: WorkoutSet = {
      ...lastSet,
      id: uuidv4(),
    };
    void runSubmit([...sets, duplicatedSet]);
  };

  const handleDeleteSet = (setId: string) => {
    void runSubmit(sets.filter((set) => set.id !== setId));
  };

  const startDraft = (setId: string, field: SetField, value: number) => {
    setDraft({ setId, field, text: String(value) });
    setCommitError(null);
  };

  const updateDraft = (setId: string, field: SetField, text: string) => {
    setDraft({ setId, field, text });
    setCommitError(null);
  };

  const draftValue = (setId: string, field: SetField, value: number): string =>
    draft !== null && draft.setId === setId && draft.field === field
      ? draft.text
      : String(value);

  const commitDraft = () => {
    if (draft === null) return;

    const parsed = Number(draft.text);

    if (!Number.isFinite(parsed)) {
      setDraft(null);
      return;
    }

    const nextValue = clampFieldValue(parsed, draft.field);

    if (sets.some((set) => set.id === draft.setId && set[draft.field] === nextValue)) {
      setDraft(null);
      setCommitError(null);
      return;
    }

    const nextSets = sets.map((set) =>
      set.id === draft.setId ? { ...set, [draft.field]: nextValue } : set
    );
    void runSubmit(nextSets);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[90] backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-zinc-900 rounded-t-3xl z-[100] max-h-[85vh] flex flex-col"
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold">{exercise.name}</h2>
              <button
                onClick={onClose}
                className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="grid grid-cols-10 gap-2 text-sm text-gray-400 font-medium px-2">
                <div className="col-span-1 text-center">Set</div>
                <div className="col-span-4 text-center">{formatWeightUnit(unit)}</div>
                <div className="col-span-4 text-center">Reps</div>
                <div className="col-span-1"></div>
              </div>

              {sets.map((set, index) => (
                <div
                  key={set.id}
                  className="grid grid-cols-10 gap-2 items-center bg-white/5 p-2 rounded-xl"
                >
                  <div className="col-span-1 text-center font-bold text-gray-500">
                    {index + 1}
                  </div>
                  <div className="col-span-4">
                    <div className="flex items-center bg-black/40 rounded-lg p-1">
                      <button
                        onClick={() =>
                          commitFieldValue(
                            set.id,
                            "weight",
                             Math.max(0, set.weight - weightStep)
                           )
                         }
                        disabled={controlsDisabled}
                        className="p-2 hover:bg-white/10 rounded-md transition-colors disabled:opacity-40"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="number"
                        value={draftValue(set.id, "weight", set.weight)}
                        disabled={controlsDisabled}
                        onFocus={() =>
                          startDraft(set.id, "weight", set.weight)
                        }
                        onChange={(e) =>
                          updateDraft(set.id, "weight", e.target.value)
                        }
                        onBlur={commitDraft}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.currentTarget.blur();
                          }
                        }}
                        className="w-full bg-transparent text-center font-bold outline-none disabled:opacity-40"
                      />
                      <span className="pr-2 text-xs text-zinc-500">{formatWeight(set.weight, unit, 0)}</span>
                      <button
                          onClick={() =>
                            commitFieldValue(set.id, "weight", set.weight + weightStep)
                          }
                        disabled={controlsDisabled}
                        className="p-2 hover:bg-white/10 rounded-md transition-colors disabled:opacity-40"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="col-span-4">
                    <div className="flex items-center bg-black/40 rounded-lg p-1">
                      <button
                        onClick={() =>
                          commitFieldValue(
                            set.id,
                            "reps",
                            Math.max(0, set.reps - 1)
                          )
                        }
                        disabled={controlsDisabled}
                        className="p-2 hover:bg-white/10 rounded-md transition-colors disabled:opacity-40"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="number"
                        value={draftValue(set.id, "reps", set.reps)}
                        disabled={controlsDisabled}
                        onFocus={() => startDraft(set.id, "reps", set.reps)}
                        onChange={(e) =>
                          updateDraft(set.id, "reps", e.target.value)
                        }
                        onBlur={commitDraft}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.currentTarget.blur();
                          }
                        }}
                        className="w-full bg-transparent text-center font-bold outline-none disabled:opacity-40"
                      />
                      <button
                        onClick={() =>
                          commitFieldValue(set.id, "reps", set.reps + 1)
                        }
                        disabled={controlsDisabled}
                        className="p-2 hover:bg-white/10 rounded-md transition-colors disabled:opacity-40"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="col-span-1 flex flex-col items-center gap-1">
                    {index === sets.length - 1 && (
                      <button
                        onClick={handleDuplicateLastSet}
                        disabled={controlsDisabled}
                        className="p-2 text-zinc-300 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-40"
                        aria-label="Duplicate last set"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteSet(set.id)}
                      disabled={controlsDisabled}
                      className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-40"
                      aria-label="Delete set"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              {commitError !== null ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-1.5">
                  <p className="text-xs text-red-200">{commitError}</p>
                  {draft !== null ? (
                    <button
                      type="button"
                      onClick={commitDraft}
                      disabled={controlsDisabled}
                      className="min-h-11 rounded-lg border border-red-500/30 px-3 text-xs font-semibold text-red-100 transition-colors hover:bg-red-500/10 disabled:opacity-40"
                    >
                      Retry
                    </button>
                  ) : null}
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleAddSet}
                  disabled={controlsDisabled}
                  className="w-full py-4 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 font-bold rounded-xl border border-purple-600/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  <Plus className="h-5 w-5" />
                  Add Set
                </button>
                <button
                  onClick={handleAddIncrementedSet}
                  disabled={controlsDisabled}
                  className="w-full py-4 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-bold rounded-xl border border-emerald-500/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  <Plus className="h-5 w-5" />
                  Auto +{formatWeight(weightStep, unit, unit === "kgs" ? 1 : 0)}/-2
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
