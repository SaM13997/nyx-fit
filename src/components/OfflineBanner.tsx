import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff } from "lucide-react";

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
      {isOffline && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-0 left-0 right-0 z-[70] mx-auto max-w-lg px-4 pt-[max(0.75rem,env(safe-area-inset-top))]"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-3 rounded-xl border border-orange-500/30 bg-zinc-900/95 px-4 py-3 shadow-lg backdrop-blur-md">
            <WifiOff className="h-5 w-5 shrink-0 text-orange-400" aria-hidden />
            <p className="text-sm text-zinc-200">
              You&apos;re offline. Cached pages work; sign in and sync need a
              connection.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
