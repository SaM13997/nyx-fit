import { useState, useEffect } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download } from "lucide-react";
import {
  type BeforeInstallPromptEvent,
  dismissInstallPrompt,
  isInstallPromptDismissed,
  isStandalonePwa,
} from "@/lib/pwa";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const isSuppressed =
    pathname === "/login" ||
    pathname === "/onboarding" ||
    pathname.startsWith("/design");

  useEffect(() => {
    if (isStandalonePwa() || isInstallPromptDismissed()) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
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
    dismissInstallPrompt();
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && !isSuppressed && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.95 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="fixed top-4 left-4 right-4 z-[60] mx-auto max-w-sm"
        >
          <div className="rounded-2xl border border-border bg-popover p-4 shadow-lg shadow-orange-600/15 dark:shadow-orange-900/20 backdrop-blur-md">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-600/30 dark:border-orange-500/20">
                <Download className="h-5 w-5 text-orange-700 dark:text-orange-400" aria-hidden />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-foreground">
                  Install Nyx Fit
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Add to your home screen for faster access and offline use.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDismiss}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-fill hover:text-foreground"
                aria-label="Dismiss install prompt"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={handleDismiss}
                className="flex min-h-11 flex-1 items-center justify-center rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-ink-secondary transition-colors hover:bg-fill hover:text-foreground"
              >
                Not now
              </button>
              <button
                type="button"
                onClick={handleInstallClick}
                className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-orange-600 to-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-600/30 dark:shadow-orange-900/20 transition-all hover:from-orange-500 hover:to-rose-500 active:scale-95"
              >
                <Download className="h-4 w-4" aria-hidden />
                Install
              </button>
            </div>
            <p className="mt-3 text-center text-[11px] leading-relaxed text-ink-subtle">
              By installing, you agree to our{" "}
              <Link
                to="/terms"
                className="text-muted-foreground underline decoration-line-strong underline-offset-2 transition-colors hover:text-foreground"
              >
                Terms
              </Link>{" "}
              and{" "}
              <Link
                to="/privacy"
                className="text-muted-foreground underline decoration-line-strong underline-offset-2 transition-colors hover:text-foreground"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
