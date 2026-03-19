import { WorkoutSet, Workout, type WeightUnit } from "@/lib/types";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, Minus, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { formatWeight, formatWeightUnit, getWeightStep } from "@/lib/units";

const DEFAULT_REP_DECREMENT = 2;

interface SetDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseId: string;
  unit: WeightUnit;
  workout: Workout;
  onUpdate: (exerciseId: string, sets: WorkoutSet[]) => void;
}

export function SetDrawer({
  isOpen,
  onClose,
  exerciseId,
  unit,
  workout,
  onUpdate,
}: SetDrawerProps) {
  const exercise = workout.exercises.find((e) => e.id === exerciseId);
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const weightStep = getWeightStep(unit);

  useEffect(() => {
    if (exercise) {
      setSets(exercise.sets);
    }
  }, [exercise]);

  if (!exercise) return null;

  const handleAddSet = () => {
    const lastSet = sets[sets.length - 1];
    const newSet: WorkoutSet = {
      id: uuidv4(),
      weight: lastSet ? lastSet.weight : 0,
      reps: lastSet ? lastSet.reps : 0,
    };
    const newSets = [...sets, newSet];
    setSets(newSets);
    onUpdate(exerciseId, newSets);
  };

  const handleAddIncrementedSet = () => {
    const lastSet = sets[sets.length - 1];

    if (!lastSet) {
      handleAddSet();
      return;
    }

    const newSet: WorkoutSet = {
      id: uuidv4(),
      weight: lastSet.weight + weightStep,
      reps: Math.max(0, lastSet.reps - DEFAULT_REP_DECREMENT),
    };
    const newSets = [...sets, newSet];
    setSets(newSets);
    onUpdate(exerciseId, newSets);
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
    const newSets = [...sets, duplicatedSet];
    setSets(newSets);
    onUpdate(exerciseId, newSets);
  };

  const handleUpdateSet = (setId: string, field: keyof WorkoutSet, value: number) => {
    const newSets = sets.map((set) =>
      set.id === setId ? { ...set, [field]: value } : set
    );
    setSets(newSets);
    onUpdate(exerciseId, newSets);
  };

  const handleDeleteSet = (setId: string) => {
    const newSets = sets.filter((set) => set.id !== setId);
    setSets(newSets);
    onUpdate(exerciseId, newSets);
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
                          handleUpdateSet(
                            set.id,
                            "weight",
                             Math.max(0, set.weight - weightStep)
                           )
                         }
                        className="p-2 hover:bg-white/10 rounded-md transition-colors"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="number"
                        value={set.weight}
                        onChange={(e) =>
                          handleUpdateSet(
                            set.id,
                            "weight",
                            Number(e.target.value)
                          )
                        }
                        className="w-full bg-transparent text-center font-bold outline-none"
                      />
                      <span className="pr-2 text-xs text-zinc-500">{formatWeight(set.weight, unit, 0)}</span>
                      <button
                          onClick={() =>
                            handleUpdateSet(set.id, "weight", set.weight + weightStep)
                          }
                        className="p-2 hover:bg-white/10 rounded-md transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="col-span-4">
                    <div className="flex items-center bg-black/40 rounded-lg p-1">
                      <button
                        onClick={() =>
                          handleUpdateSet(
                            set.id,
                            "reps",
                            Math.max(0, set.reps - 1)
                          )
                        }
                        className="p-2 hover:bg-white/10 rounded-md transition-colors"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="number"
                        value={set.reps}
                        onChange={(e) =>
                          handleUpdateSet(set.id, "reps", Number(e.target.value))
                        }
                        className="w-full bg-transparent text-center font-bold outline-none"
                      />
                      <button
                        onClick={() =>
                          handleUpdateSet(set.id, "reps", set.reps + 1)
                        }
                        className="p-2 hover:bg-white/10 rounded-md transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="col-span-1 flex flex-col items-center gap-1">
                    {index === sets.length - 1 && (
                      <button
                        onClick={handleDuplicateLastSet}
                        className="p-2 text-zinc-300 hover:bg-white/10 rounded-lg transition-colors"
                        aria-label="Duplicate last set"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteSet(set.id)}
                      className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleAddSet}
                  className="w-full py-4 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 font-bold rounded-xl border border-purple-600/30 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Add Set
                </button>
                <button
                  onClick={handleAddIncrementedSet}
                  className="w-full py-4 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-bold rounded-xl border border-emerald-500/30 transition-colors flex items-center justify-center gap-2"
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
