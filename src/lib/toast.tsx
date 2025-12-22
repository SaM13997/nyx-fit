import React, { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Check, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
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

  const success = useCallback((message: string) => {
    addToast(message, "success");
  }, [addToast]);

  const error = useCallback((message: string) => {
    addToast(message, "error");
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toast, success, error }}>
      {children}
      {typeof document !== "undefined" && createPortal(
        <div className="fixed top-4 left-0 right-0 z-[100] flex flex-col items-center gap-2 pointer-events-none p-4">
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
    success: <Check className="w-4 h-4 text-emerald-400" />,
    error: <AlertCircle className="w-4 h-4 text-red-400" />,
    info: <Info className="w-4 h-4 text-blue-400" />,
  };

  const bgColors = {
    success: "bg-zinc-900/95 border-emerald-500/20",
    error: "bg-zinc-900/95 border-red-500/20",
    info: "bg-zinc-900/95 border-blue-500/20",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      className={cn(
        "pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md min-w-[300px] max-w-md",
        bgColors[toast.type]
      )}
    >
      <div className={cn("p-1.5 rounded-full bg-white/5 border border-white/5")}>
        {icons[toast.type]}
      </div>
      <p className="text-sm font-medium text-white flex-1">{toast.message}</p>
      <button
        onClick={onClose}
        className="p-1 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white"
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

