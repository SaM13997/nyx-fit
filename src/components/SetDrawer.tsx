import { Exercise, WorkoutSet, Workout } from "@/lib/types";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

interface SetDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseId: string;
  workout: Workout;
  onUpdate: (exerciseId: string, sets: WorkoutSet[]) => void;
}

export function SetDrawer({
  isOpen,
  onClose,
  exerciseId,
  workout,
  onUpdate,
}: SetDrawerProps) {
  const exercise = workout.exercises.find((e) => e.id === exerciseId);
  const [sets, setSets] = useState<WorkoutSet[]>([]);

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
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-zinc-900 rounded-t-3xl z-50 max-h-[85vh] flex flex-col"
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
                <div className="col-span-4 text-center">lbs</div>
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
                            Math.max(0, set.weight - 5)
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
                      <button
                        onClick={() =>
                          handleUpdateSet(set.id, "weight", set.weight + 5)
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
                  <div className="col-span-1 flex justify-center">
                    <button
                      onClick={() => handleDeleteSet(set.id)}
                      className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={handleAddSet}
                className="w-full py-4 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 font-bold rounded-xl border border-purple-600/30 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Add Set
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
