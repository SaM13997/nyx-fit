import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useState } from "react";
import { WheelPicker } from "./wheel-picker";
import { Exercise } from "@/lib/types";

interface AddExerciseDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSet: (exerciseName: string, weight: number, reps: number) => void;
  exercises: Exercise[];
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

const WEIGHT_OPTIONS = Array.from({ length: 80 }, (_, i) =>
  ((i + 1) * 5).toString()
); // 5 to 400
const REP_OPTIONS = Array.from({ length: 15 }, (_, i) => (i + 2).toString()); // 2 to 16

export function AddExerciseDrawer({
  isOpen,
  onClose,
  onAddSet,
  exercises,
}: AddExerciseDrawerProps) {
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [pickerExercise, setPickerExercise] = useState(COMMON_EXERCISES[0]);
  const [weight, setWeight] = useState("45");
  const [reps, setReps] = useState("8");

  const handleAddSet = () => {
    if (selectedExercise) {
      onAddSet(selectedExercise, parseInt(weight), parseInt(reps));
    }
  };

  const currentExerciseSetCount = selectedExercise
    ? exercises.find((e) => e.name === selectedExercise)?.sets.length || 0
    : 0;

  const resetState = () => {
    setSelectedExercise(null);
    setPickerExercise(COMMON_EXERCISES[0]);
    setWeight("45");
    setReps("8");
  };

  return (
    <AnimatePresence onExitComplete={resetState}>
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
            className="fixed bottom-0 left-0 right-0 bg-zinc-900 rounded-t-3xl z-[100] max-h-[85vh] flex flex-col border-t border-white/10"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <AnimatePresence mode="popLayout" initial={false}>
                  {selectedExercise ? (
                    <motion.h2
                      key="selected"
                      initial={{ opacity: 0, y: -20, filter: "blur(10px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="text-xl font-bold text-white block"
                    >
                      {selectedExercise}
                    </motion.h2>
                  ) : (
                    <motion.h2
                      key="default"
                      initial={{ opacity: 0, y: -20, filter: "blur(10px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="text-xl font-bold text-white block"
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
                    className="bg-purple-600/20 text-purple-300 px-3 py-1 rounded-full text-sm font-bold border border-purple-500/20"
                  >
                    {currentExerciseSetCount} sets
                  </motion.div>
                )}
                <button
                  onClick={onClose}
                  className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 flex flex-col items-center gap-8">
              {!selectedExercise ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="w-full flex flex-col items-center gap-6"
                >
                  <div className="relative h-48 w-full overflow-hidden">
                    <WheelPicker
                      options={COMMON_EXERCISES.map((ex) => ({
                        value: ex,
                        label: ex,
                      }))}
                      value={pickerExercise}
                      onValueChange={(val) => setPickerExercise(val)}
                    />
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-zinc-900 via-transparent to-zinc-900" />
                  </div>

                  <motion.button
                    onClick={() => setSelectedExercise(pickerExercise)}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white rounded-xl py-4 font-bold text-lg transition-colors shadow-lg shadow-purple-900/20"
                  >
                    Select {pickerExercise}
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full flex flex-col gap-8"
                >
                  <div className="flex justify-center gap-4">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">Lbs</span>
                      <div className="relative h-40 w-32 overflow-hidden">
                        <WheelPicker
                          options={WEIGHT_OPTIONS.map((w) => ({ value: w, label: w }))}
                          value={weight}
                          onValueChange={(val) => setWeight(val)}
                        />
                        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-zinc-900/80 via-transparent to-zinc-900/80" />
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                      <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">Reps</span>
                      <div className="relative h-40 w-32 overflow-hidden">
                        <WheelPicker
                          options={REP_OPTIONS.map((r) => ({ value: r, label: r }))}
                          value={reps}
                          onValueChange={(val) => setReps(val)}
                        />
                        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-zinc-900/80 via-transparent to-zinc-900/80" />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleAddSet}
                    className="w-full bg-white text-black hover:bg-gray-200 rounded-xl py-4 font-bold text-lg transition-colors shadow-lg active:scale-[0.98]"
                  >
                    Log Set
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
