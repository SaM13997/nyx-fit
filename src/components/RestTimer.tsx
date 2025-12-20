import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, X, Bell } from "lucide-react";
import { RiRestTimeLine } from "react-icons/ri";
import { cn } from "@/lib/utils";
import { useAppearance } from "@/lib/AppearanceContext";

interface RestTimerProps {
  isActiveWorkout: boolean;
}

const STORAGE_KEY = "nyx-rest-timer-state";
const TOOLTIP_STORAGE_KEY = "nyx-rest-timer-tooltip-shown";

interface TimerState {
  timeLeft: number;
  isActive: boolean;
  expectedEndTime: number | null;
}

export function RestTimer({ isActiveWorkout }: RestTimerProps) {
  const { restTimerDuration } = useAppearance();
  const [timeLeft, setTimeLeft] = useState(restTimerDuration);
  const [isActive, setIsActive] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleTimerComplete = useCallback(() => {
    setShowToast(true);
    if ("vibrate" in navigator) {
      navigator.vibrate([500, 200, 500]);
    }
    if (Notification.permission === "granted" && document.hidden) {
      new Notification("Rest over!", {
        body: "Time for your next set!",
        icon: "/favicon.ico",
      });
    }
    setTimeout(() => setShowToast(false), 5000);
  }, []);

  const persistState = useCallback((newIsActive: boolean, newTimeLeft: number) => {
    const state: TimerState = {
      timeLeft: newTimeLeft,
      isActive: newIsActive,
      expectedEndTime: newIsActive ? Date.now() + newTimeLeft * 1000 : null,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, []);

  // Initialize from LocalStorage
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const state: TimerState = JSON.parse(savedState);
        const now = Date.now();

        if (state.isActive && state.expectedEndTime) {
          const remaining = Math.max(0, Math.ceil((state.expectedEndTime - now) / 1000));
          if (remaining > 0) {
            setTimeLeft(remaining);
            setIsActive(true);
          } else {
            setTimeLeft(0);
            setIsActive(false);
            handleTimerComplete();
          }
        } else {
          setTimeLeft(state.timeLeft);
          setIsActive(false);
        }
      } catch (e) {
        console.error("Failed to parse timer state", e);
      }
    } else {
      setTimeLeft(restTimerDuration);
    }
  }, [restTimerDuration, handleTimerComplete]);

  // Handle duration changes from settings only when timer is not active
  useEffect(() => {
    if (!isActive && timeLeft !== 0 && timeLeft !== restTimerDuration) {
      setTimeLeft(restTimerDuration);
    }
  }, [restTimerDuration, isActive, timeLeft]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setIsActive(false);
            handleTimerComplete();
            persistState(false, 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft, handleTimerComplete, persistState]);

  const toggleTimer = () => {
    const tooltipShown = localStorage.getItem(TOOLTIP_STORAGE_KEY);
    if (!tooltipShown) {
      setShowTooltip(true);
      localStorage.setItem(TOOLTIP_STORAGE_KEY, "true");
      setTimeout(() => setShowTooltip(false), 4000);
    }

    if (!isActive && Notification.permission === "default") {
      Notification.requestPermission();
    }
    
    const nextActive = !isActive;
    setIsActive(nextActive);
    // If we're starting a finished timer, reset it to duration
    const nextTime = timeLeft === 0 ? restTimerDuration : timeLeft;
    if (timeLeft === 0) setTimeLeft(restTimerDuration);
    
    persistState(nextActive, nextTime);
  };

  const handleLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setIsDrawerOpen(true);
    if ("vibrate" in navigator) {
      navigator.vibrate(50);
    }
  };

  const onPointerDown = () => {
    longPressTimerRef.current = setTimeout(handleLongPress, 600);
  };

  const onPointerUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const resetTimer = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsActive(false);
    setTimeLeft(restTimerDuration);
    persistState(false, restTimerDuration);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isActiveWorkout) return null;

  return (
    <>
      <div className="flex items-center gap-4">
        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ opacity: 0, x: 20, filter: "blur(10px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: 20, filter: "blur(10px)" }}
              className="flex items-center gap-3"
            >
              <span className="text-2xl font-black font-heading tabular-nums text-orange-400">
                {formatTime(timeLeft)}
              </span>
              <button
                onClick={resetTimer}
                className="p-2 rounded-full bg-white/5 border border-white/10 text-zinc-500 hover:text-white transition-all active:scale-90"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative">
          <AnimatePresence>
            {showTooltip && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                className="absolute bottom-full right-0 mb-4 px-4 py-2 bg-zinc-800 text-white text-[10px] font-bold rounded-xl shadow-2xl whitespace-nowrap z-50 border border-white/10 uppercase tracking-tight"
              >
                Hold the button to see what it does
                <div className="absolute top-full right-6 w-3 h-3 bg-zinc-800 rotate-45 -translate-y-1.5 border-r border-b border-white/10" />
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            onClick={toggleTimer}
            className={cn(
              "group relative flex items-center justify-center h-14 w-14 rounded-full transition-all active:scale-95 border",
              isActive 
                ? "bg-orange-500/10 border-orange-500/20" 
                : "bg-white/5 border-white/10 hover:bg-white/10"
            )}
          >
            <div className={cn(
              "absolute inset-0 rounded-full transition-all duration-500 blur-md",
              isActive 
                ? "bg-orange-500/20 opacity-100" 
                : "bg-white/5 opacity-0 group-hover:opacity-100"
            )} />
            
            <RiRestTimeLine className={cn(
              "h-6 w-6 relative z-10 transition-colors duration-300",
              isActive ? "text-orange-400" : "text-zinc-400 group-hover:text-white"
            )} />
          </button>
        </div>
      </div>

      {/* Info Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 z-[150] backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-zinc-900 rounded-t-4xl z-[160] p-8 border-t border-white/10"
            >
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8" />
              
              <div className="flex items-center gap-5 mb-8">
                <div className="h-16 w-16 rounded-3xl bg-orange-500/20 flex items-center justify-center border border-orange-500/20 shadow-lg shadow-orange-500/10">
                  <RiRestTimeLine className="h-9 w-9 text-orange-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-black font-heading text-white">Rest Timer</h2>
                  <p className="text-zinc-400 text-sm font-medium tracking-tight">Stay consistent with your sets</p>
                </div>
              </div>

              <div className="space-y-4 mb-10">
                <div className="p-5 bg-white/5 rounded-3xl border border-white/5 flex gap-4">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <RiRestTimeLine className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white mb-1 text-sm">Quick Start</h3>
                    <p className="text-zinc-400 text-xs leading-relaxed font-medium">
                      Tap the icon to start your rest period. Tap again to pause. The time remaining will appear next to the button.
                    </p>
                  </div>
                </div>
                
                <div className="p-5 bg-white/5 rounded-3xl border border-white/5 flex gap-4">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Bell className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white mb-1 text-sm">Always Alert</h3>
                    <p className="text-zinc-400 text-xs leading-relaxed font-medium">
                      Get notified via toast, vibration, and system alerts when your rest is over, even if the app is in the background.
                    </p>
                  </div>
                </div>

                <div className="p-5 bg-white/5 rounded-3xl border border-white/5 flex gap-4">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <RotateCcw className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white mb-1 text-sm">Custom Duration</h3>
                    <p className="text-zinc-400 text-xs leading-relaxed font-medium">
                      Change the default duration (30s to 5m) anytime in the App Settings page.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsDrawerOpen(false)}
                className="w-full bg-white text-black py-5 rounded-2xl font-black font-heading text-lg transition-all active:scale-[0.98] shadow-xl hover:bg-zinc-100"
              >
                GOT IT
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-6 left-4 right-4 z-[200] flex justify-center pointer-events-none"
          >
            <div className="bg-orange-500 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-orange-500/40 flex items-center gap-4 pointer-events-auto border border-orange-400">
              <div className="bg-white/20 p-2 rounded-full">
                <Bell className="h-5 w-5 animate-bounce" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Rest period over!</h4>
                <p className="text-white/80 text-xs">Time for your next set.</p>
              </div>
              <button
                onClick={() => setShowToast(false)}
                className="ml-2 p-1 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
