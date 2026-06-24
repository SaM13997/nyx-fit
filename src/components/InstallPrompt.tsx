import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { X, Download } from "lucide-react";

const DISMISS_KEY = "nyx-fit-install-prompt-dismissed";
const DISMISS_DAYS = 7;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandaloneDisplay(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

function wasRecentlyDismissed(): boolean {
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;

  const dismissedAt = Number(raw);
  if (Number.isNaN(dismissedAt)) return false;

  const msPerDay = 24 * 60 * 60 * 1000;
  return Date.now() - dismissedAt < DISMISS_DAYS * msPerDay;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isStandaloneDisplay() || wasRecentlyDismissed()) return;

    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsVisible(false);
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setIsVisible(false);
    setDeferredPrompt(null);
  };

  return (
    <AnimatePresence>
      {isVisible ? (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.95 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="fixed top-4 left-4 right-4 z-[60] mx-auto max-w-sm pt-[max(0rem,env(safe-area-inset-top))]"
        >
          <div className="rounded-2xl border border-white/10 bg-zinc-900/95 p-4 shadow-lg shadow-purple-950/30 backdrop-blur-md">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/20 to-purple-600/20 ring-1 ring-orange-500/30">
                <Download className="h-5 w-5 text-orange-400" aria-hidden />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white">
                  Install Nyx Fitness
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                  Add to your home screen for faster access and offline
                  browsing.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDismiss}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
                aria-label="Dismiss install prompt"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={handleDismiss}
                className="flex h-11 min-w-[44px] flex-1 items-center justify-center rounded-xl border border-white/10 px-4 text-sm font-semibold text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
              >
                Not now
              </button>
              <button
                type="button"
                onClick={handleInstallClick}
                className="flex h-11 min-w-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 text-sm font-semibold text-white shadow-lg shadow-orange-900/30 transition-all hover:from-orange-400 hover:to-orange-500 active:scale-[0.98]"
              >
                <Download className="h-4 w-4" aria-hidden />
                Install
              </button>
            </div>
            <p className="mt-3 text-center text-[11px] leading-relaxed text-zinc-500">
              By installing, you agree to our{" "}
              <Link
                to="/terms"
                className="text-zinc-400 underline-offset-2 hover:text-orange-400 hover:underline"
              >
                Terms
              </Link>{" "}
              and{" "}
              <Link
                to="/privacy"
                className="text-zinc-400 underline-offset-2 hover:text-orange-400 hover:underline"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
