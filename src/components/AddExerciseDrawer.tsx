import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { useState } from "react";

interface AddExerciseDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExercise: (name: string) => void;
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

export function AddExerciseDrawer({
  isOpen,
  onClose,
  onAddExercise,
}: AddExerciseDrawerProps) {
  const [search, setSearch] = useState("");

  const filteredExercises = COMMON_EXERCISES.filter((ex) =>
    ex.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = (name: string) => {
    onAddExercise(name);
    setSearch("");
    onClose();
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
              <h2 className="text-xl font-bold">Add Exercise</h2>
              <button
                onClick={onClose}
                className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 border-b border-white/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search exercise..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-black/40 rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {search && !filteredExercises.includes(search) && (
                <button
                  onClick={() => handleAdd(search)}
                  className="w-full text-left p-4 rounded-xl bg-purple-600/20 text-purple-300 font-medium mb-2"
                >
                  Create "{search}"
                </button>
              )}

              <div className="space-y-2">
                {filteredExercises.map((exercise) => (
                  <button
                    key={exercise}
                    onClick={() => handleAdd(exercise)}
                    className="w-full text-left p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors font-medium"
                  >
                    {exercise}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
