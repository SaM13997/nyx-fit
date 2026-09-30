import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Check, AlertCircle, Info } from "lucide-react";
import { springs } from "@/lib/motion";
import { createPortal } from "react-dom";

export type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 5000); // Auto remove after 5s
  }, [removeToast]);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    addToast(message, type);
  }, [addToast]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const success = useCallback((message: string) => {
    addToast(message, "success");
  }, [addToast]);

  const error = useCallback((message: string) => {
    addToast(message, "error");
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toast, success, error }}>
      {children}
      {/* Portal only after mount: rendering it during hydration would not
          match the server HTML and React would re-render the whole app. */}
      {mounted && createPortal(
        <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <AnimatePresence mode="popLayout">
            {toasts.map((t) => (
              <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
            ))}
          </AnimatePresence>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const icons = {
    success: <Check className="w-4 h-4 text-success-ink" />,
    error: <AlertCircle className="w-4 h-4 text-danger-ink" />,
    info: <Info className="w-4 h-4 text-info-ink" />,
  };

  return (
    <motion.div
      layout
      role={toast.type === "error" ? "alert" : "status"}
      initial={{ opacity: 0, y: -24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.95, transition: { duration: 0.18 } }}
      transition={springs.pop}
      // Flick up to dismiss, like a native banner.
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0.8, bottom: 0.1 }}
      onDragEnd={(_, info) => {
        if (info.offset.y < -32 || info.velocity.y < -400) onClose();
      }}
      className="pointer-events-auto flex w-full max-w-md touch-none items-center gap-3 rounded-2xl border border-border bg-popover px-4 py-3 text-popover-foreground shadow-float backdrop-blur-md"
    >
      <div className="p-1.5 rounded-full bg-fill border border-hairline">
        {icons[toast.type]}
      </div>
      <p className="text-sm font-medium text-foreground flex-1">{toast.message}</p>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onClose}
        className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-fill-strong hover:text-foreground"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

