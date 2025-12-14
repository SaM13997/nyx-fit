import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Workout } from "@/lib/types";
import { BODY_PARTS } from "@/lib/constants";
import { useState, useEffect } from "react";

interface WorkoutStatusCardProps {
  activeWorkout: Workout | null;
  isLoading?: boolean;
  isStarting: boolean;
  onStartWorkout: (bodyParts: string[]) => void;
}

export function WorkoutStatusCard({
  activeWorkout,
  isLoading = false,
  isStarting,
  onStartWorkout,
}: WorkoutStatusCardProps) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedParts, setSelectedParts] = useState<Set<string>>(new Set());
  const [expandedPart, setExpandedPart] = useState<string | null>(null);
  const [lastWorkedParts, setLastWorkedParts] = useState<string[]>([]);

  // Load last worked parts from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("lastWorkedBodyParts");
    if (stored) {
      try {
        setLastWorkedParts(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse lastWorkedBodyParts", e);
      }
    }
  }, []);

  const handleCardClick = () => {
    if (!activeWorkout && !isStarting && !isLoading) {
      setIsSelecting(true);
    }
  };

  const togglePart = (partId: string) => {
    const newSelected = new Set(selectedParts);
    if (newSelected.has(partId)) {
      newSelected.delete(partId);
      // Also remove any sub-parts
      const part = BODY_PARTS.find((p) => p.id === partId);
      if (part?.subParts) {
        part.subParts.forEach((sub) => newSelected.delete(`${partId}:${sub}`));
      }
    } else {
      newSelected.add(partId);
    }
    setSelectedParts(newSelected);
  };

  const toggleSubPart = (parentId: string, subPart: string) => {
    const newSelected = new Set(selectedParts);
    const subPartKey = `${parentId}:${subPart}`;
    if (newSelected.has(subPartKey)) {
      newSelected.delete(subPartKey);
    } else {
      newSelected.add(subPartKey);
    }
    setSelectedParts(newSelected);
  };

  const handleStartWorkout = () => {
    const parts = Array.from(selectedParts);
    onStartWorkout(parts);
    setIsSelecting(false);
    setSelectedParts(new Set());
    setExpandedPart(null);
  };

  const isPartLastWorked = (partId: string) => {
    return lastWorkedParts.some((p) => p === partId || p.startsWith(`${partId}:`));
  };

  return (
    <motion.div
      layout
      layoutId="workout-status-container"
      onClick={!isSelecting ? handleCardClick : undefined}
      className={cn(
        "relative overflow-hidden rounded-[2rem] p-6 border border-white/10 shadow-2xl backdrop-blur-md bg-black/80",
        !activeWorkout && !isStarting && !isLoading && !isSelecting && "cursor-pointer",
        (isStarting || isLoading) && "opacity-50"
      )}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Background Gradient */}
      <motion.div
        className="absolute inset-0"
        initial={false}
        animate={{
          background: activeWorkout
            ? "linear-gradient(to bottom right, rgba(1, 107, 40, 0.4), rgba(24, 24, 27, 1), rgba(0, 0, 0, 1))"
            : "linear-gradient(to bottom right, rgba(147, 51, 234, 0.4), rgba(24, 24, 27, 1), rgba(0, 0, 0, 1))",
        }}
        transition={{ duration: 0.5 }}
      />

      {activeWorkout ? (
        <Link
          to="/workout/$id"
          params={{ id: activeWorkout.id }}
          className="absolute inset-0 z-20"
          aria-label="View active workout"
        />
      ) : null}

      <div className="relative z-10">
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <div className="text-left flex-1">
                  <div className="h-7 w-48 bg-white/10 rounded-lg mb-2 animate-pulse" />
                  <div className="h-5 w-32 bg-white/5 rounded-md animate-pulse" />
                </div>
                <div className="rounded-full h-14 w-14 bg-white/5 border border-white/10 animate-pulse" />
              </div>
            </motion.div>
          ) : isSelecting ? (
            <motion.div
              key="selecting"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-xl font-bold mb-4">Select Body Parts</h2>
              <p className="text-sm text-gray-400 mb-6">
                What are you working on today?
              </p>

              <motion.div
                layout
                className="grid grid-cols-2 gap-3 mb-6"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              >
                {BODY_PARTS.map((part) => {
                  const isSelected = selectedParts.has(part.id);
                  const isExpanded = expandedPart === part.id;
                  const hasSubParts = part.subParts && part.subParts.length > 0;
                  const isLastWorked = isPartLastWorked(part.id);

                  return (
                    <motion.div
                      key={part.id}
                      layout
                      className={cn("col-span-1", isExpanded && "col-span-2")}
                    >
                      <motion.button
                        layout
                        onClick={() => {
                          togglePart(part.id);
                          if (hasSubParts) {
                            setExpandedPart(isExpanded ? null : part.id);
                          }
                        }}
                        className={cn(
                          "w-full p-4 rounded-2xl border transition-all text-left relative overflow-hidden group",
                          isSelected
                            ? "border-transparent"
                            : "bg-white/5 border-white/10 hover:bg-white/10"
                        )}
                      >
                        {isSelected && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0"
                          >
                            <motion.div
                              layoutId={`border-${part.id}`}
                              className="absolute inset-0 border-transparent bg-gradient-to-br from-purple-500 to-indigo-600"
                              style={{ borderRadius: "1rem" }}
                            />
                            <div className="absolute inset-[1.5px] bg-black/40 backdrop-blur-xl rounded-[calc(1rem-1.5px)]" />
                          </motion.div>
                        )}

                        <div className="relative z-10 flex flex-col h-full">
                          <div className="flex justify-between items-start mb-2">
                            <div
                              className={cn(
                                "w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-300",
                                isSelected
                                  ? "bg-purple-500 border-purple-500 shadow-lg shadow-purple-500/30"
                                  : "border-white/20 group-hover:border-white/40"
                              )}
                            >
                              {isSelected && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                >
                                  <Check className="w-3.5 h-3.5 text-white" />
                                </motion.div>
                              )}
                            </div>
                            {isLastWorked && (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                                Last
                              </span>
                            )}
                          </div>

                          <span className={cn(
                            "font-bold text-lg transition-colors",
                            isSelected ? "text-white" : "text-gray-300 group-hover:text-white"
                          )}>
                            {part.label}
                          </span>
                        </div>
                      </motion.button>

                      {/* Sub-parts */}
                      <AnimatePresence>
                        {hasSubParts && isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, ease: "circOut" }}
                            className="overflow-hidden"
                          >
                            <div className="pt-2 pb-1 px-1 flex flex-wrap gap-2">
                              {part.subParts!.map((subPart) => {
                                const subPartKey = `${part.id}:${subPart}`;
                                const isSubSelected = selectedParts.has(subPartKey);
                                const isSubLastWorked = isPartLastWorked(subPartKey);

                                return (
                                  <motion.button
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    key={subPart}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleSubPart(part.id, subPart);
                                    }}
                                    className={cn(
                                      "px-3 py-1.5 rounded-full border text-sm font-medium transition-all flex items-center gap-1.5",
                                      isSubSelected
                                        ? "bg-purple-500/20 border-purple-500/40 text-purple-200"
                                        : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-gray-200"
                                    )}
                                  >
                                    {isSubSelected && <Check className="w-3 h-3" />}
                                    {subPart}
                                    {isSubLastWorked && (
                                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 ml-1" />
                                    )}
                                  </motion.button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </motion.div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsSelecting(false);
                    setSelectedParts(new Set());
                    setExpandedPart(null);
                  }}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl py-3 font-bold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartWorkout}
                  disabled={selectedParts.size === 0}
                  className={cn(
                    "flex-1 rounded-xl py-3 font-bold text-sm transition-colors shadow-lg",
                    selectedParts.size > 0
                      ? "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/20"
                      : "bg-zinc-800 text-gray-500 cursor-not-allowed"
                  )}
                >
                  Start Workout
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <motion.h2
                    layout="position"
                    className="text-xl font-bold mb-1 text-white"
                  >
                    {activeWorkout ? "Active Workout" : "Start New Workout"}
                  </motion.h2>
                  <motion.p
                    layout="position"
                    className={cn(
                      "text-sm font-medium transition-colors duration-500",
                      activeWorkout ? "text-green-400" : "text-gray-400"
                    )}
                  >
                    {activeWorkout
                      ? "In Progress"
                      : isStarting
                        ? "Starting..."
                        : "Begin your fitness session"}
                  </motion.p>
                </div>
                <motion.div
                  layout="position"
                  className={cn(
                    "rounded-full h-14 w-14 flex items-center justify-center border transition-colors duration-500",
                    activeWorkout
                      ? "bg-green-500/10 border-green-500/20"
                      : "bg-white/5 border-white/10"
                  )}
                >
                  {activeWorkout ? (
                    <div className="relative">
                      <div className="absolute inset-0 bg-green-500/20 blur-md rounded-full" />
                      <ArrowUpRight className="h-6 w-6 text-green-500 relative z-10" />
                    </div>
                  ) : (
                    <Plus className="h-6 w-6 text-gray-400" />
                  )}
                </motion.div>
              </div>

              <AnimatePresence>
                {activeWorkout && (
                  <motion.div
                    key="workout-details"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="mt-6 pt-4 border-t border-white/5 flex justify-between text-xs text-gray-500 font-medium uppercase tracking-wider">
                      <div>
                        <span className="block text-gray-600 mb-0.5">Started</span>
                        {new Date(activeWorkout.startTime!).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div className="text-right">
                        <span className="block text-gray-600 mb-0.5">Exercises</span>
                        {activeWorkout.exercises.length}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

