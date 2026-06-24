import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const updateStatus = () => setIsOffline(!navigator.onLine);

    updateStatus();
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);

    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline ? (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className="fixed top-0 inset-x-0 z-[70] px-4 pt-[max(0.75rem,env(safe-area-inset-top))]"
          role="status"
          aria-live="polite"
        >
          <div className="mx-auto flex max-w-lg items-center gap-3 rounded-2xl border border-orange-500/30 bg-zinc-950/95 px-4 py-3 text-sm text-orange-100 shadow-lg backdrop-blur-md">
            <WifiOff className="h-5 w-5 shrink-0 text-orange-400" aria-hidden />
            <p className="font-medium">
              You&apos;re offline. Cached pages work; reconnect to sync.
            </p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
