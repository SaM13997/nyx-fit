import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
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

    const title = "Rest over!";
    const options = {
      body: "Time for your next set!",
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      vibrate: [500, 200, 500],
    };

    // Try service worker notification first (better for background/Android/PWA)
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, options);
      });
    } else if (Notification.permission === "granted") {
      new Notification(title, options);
    }

    setTimeout(() => setShowToast(false), 5000);
  }, []);

  const persistState = useCallback(
    (newIsActive: boolean, newTimeLeft: number) => {
      const state: TimerState = {
        timeLeft: newTimeLeft,
        isActive: newIsActive,
        expectedEndTime: newIsActive ? Date.now() + newTimeLeft * 1000 : null,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    },
    []
  );

  // Initialize from LocalStorage
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const state: TimerState = JSON.parse(savedState);
        const now = Date.now();

        if (state.isActive && state.expectedEndTime) {
          const remaining = Math.max(
            0,
            Math.ceil((state.expectedEndTime - now) / 1000)
          );
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

  const progress = (timeLeft / restTimerDuration) * 100;
  const strokeDasharray = 2 * Math.PI * 27; // radius is 27
  const strokeDashoffset = strokeDasharray * ((100 - progress) / 100);

  if (!isActiveWorkout) return null;

  return (
    <>
      <div className="relative">
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className="absolute bottom-full right-0 mb-4 px-4 py-2 bg-zinc-800 text-white text-[10px] font-bold rounded-xl shadow-2xl whitespace-nowrap z-50 border border-white/10 uppercase tracking-tight"
            >
              Hold the button for info
              <div className="absolute top-full right-6 w-3 h-3 bg-zinc-800 rotate-45 -translate-y-1.5 border-r border-b border-white/10" />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-3">
          {isActive && (
            <motion.button
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              onClick={resetTimer}
              className="p-3 rounded-full bg-white/5 border border-white/10 text-zinc-500 hover:text-white transition-all active:scale-90"
            >
              <RotateCcw className="h-5 w-5" />
            </motion.button>
          )}

          <button
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            onClick={toggleTimer}
            className={cn(
              "group relative flex items-center justify-center h-14 w-14 rounded-full transition-all active:scale-95",
              isActive ? "bg-violet-500/5" : "bg-white/5 hover:bg-white/10"
            )}
          >
            {/* Unified SVG Border and Progress */}
            <svg className="absolute inset-0 h-full w-full -rotate-90 pointer-events-none">
              <circle
                cx="28"
                cy="28"
                r="27"
                stroke="currentColor"
                strokeWidth="2"
                fill="transparent"
                className={cn(
                  "transition-colors duration-500",
                  isActive ? "text-violet-500/20" : "text-white/10"
                )}
              />
              {isActive && (
                <motion.circle
                  cx="28"
                  cy="28"
                  r="27"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  fill="transparent"
                  strokeDasharray={strokeDasharray}
                  initial={{ strokeDashoffset: strokeDasharray }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1, ease: "linear" }}
                  className="text-violet-400"
                  strokeLinecap="round"
                />
              )}
            </svg>

            {/* Glow effect */}
            <div
              className={cn(
                "absolute inset-0 rounded-full transition-all duration-500 blur-md",
                isActive
                  ? "bg-violet-500/10 opacity-100"
                  : "bg-white/5 opacity-0 group-hover:opacity-100"
              )}
            />

            <AnimatePresence mode="wait">
              {isActive ? (
                <motion.span
                  key="time"
                  initial={{ opacity: 0, scale: 0.8, filter: "blur(5px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 0.8, filter: "blur(5px)" }}
                  className="text-[10px] font-black font-heading tabular-nums text-violet-400 relative z-10 leading-none"
                >
                  {formatTime(timeLeft)}
                </motion.span>
              ) : (
                <motion.div
                  key="icon"
                  initial={{ opacity: 0, scale: 0.8, filter: "blur(5px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 0.8, filter: "blur(5px)" }}
                  className="relative z-10"
                >
                  <RiRestTimeLine
                    className={cn(
                      "h-6 w-6 transition-colors duration-300",
                      "text-zinc-400 group-hover:text-white"
                    )}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Info Drawer - Portal to Root */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {isDrawerOpen && (
              <div className="fixed inset-0 z-999">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsDrawerOpen(false)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="absolute bottom-0 left-0 right-0 bg-zinc-900 rounded-t-[40px] p-8 border-t border-white/10 max-w-lg mx-auto"
                >
                  <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8" />

                  <div className="flex items-center gap-5 mb-8">
                    <div className="h-16 w-16 rounded-3xl bg-violet-500/20 flex items-center justify-center border border-violet-500/20 shadow-lg shadow-violet-500/10">
                      <RiRestTimeLine className="h-9 w-9 text-violet-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black font-heading text-white">
                        REST TIMER
                      </h2>
                      <p className="text-zinc-400 text-sm font-medium tracking-tight">
                        Focus on your recovery
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-10">
                    <div className="p-5 bg-white/5 rounded-3xl border border-white/5 flex gap-4">
                      <div className="h-10 w-10 shrink-0 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-500">
                        <RiRestTimeLine className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white mb-1 text-sm uppercase tracking-tight">
                          Timer at a glance
                        </h3>
                        <p className="text-zinc-400 text-xs leading-relaxed font-medium">
                          Tap the icon to start a timer that will stop you from
                          scrolling on your phone.
                        </p>
                      </div>
                    </div>

                    <div className="p-5 bg-white/5 rounded-3xl border border-white/5 flex gap-4">
                      <div className="h-10 w-10 shrink-0 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <Bell className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white mb-1 text-sm uppercase tracking-tight">
                          Never miss a set
                        </h3>
                        <p className="text-zinc-400 text-xs leading-relaxed font-medium">
                          You'll get a notification, vibration, and a toast
                          alert when your rest is finished, even if you're in
                          another app.
                        </p>
                      </div>
                    </div>

                    <div className="p-5 bg-white/5 rounded-3xl border border-white/5 flex gap-4">
                      <div className="h-10 w-10 shrink-0 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                        <RotateCcw className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white mb-1 text-sm uppercase tracking-tight">
                          Your rest, your rules
                        </h3>
                        <p className="text-zinc-400 text-xs leading-relaxed font-medium">
                          Adjust your default rest period (30s to 5m) in the
                          settings anytime. We'll remember your preferences for
                          every workout.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="w-full bg-white text-black py-5 rounded-2xl font-black font-heading text-lg transition-all active:scale-[0.98] shadow-xl hover:bg-zinc-100 uppercase tracking-widest"
                  >
                    GOT IT
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* Toast - Portal to Root */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {showToast && (
              <motion.div
                initial={{ opacity: 0, y: -50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -50, scale: 0.9 }}
                className="fixed top-6 left-4 right-4 z-1000 flex justify-center pointer-events-none"
              >
                <div className="bg-violet-600 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-violet-500/40 flex items-center gap-4 pointer-events-auto border border-violet-400 w-full max-w-sm">
                  <div className="bg-white/20 p-2 rounded-full">
                    <Bell className="h-5 w-5 animate-bounce" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm uppercase tracking-tight">
                      Rest period over!
                    </h4>
                    <p className="text-white/80 text-xs font-medium">
                      Time for your next set.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowToast(false)}
                    className="ml-auto p-1 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
