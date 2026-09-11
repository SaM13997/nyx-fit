import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { obDetail } from "./classes";

export function InlineAlert({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      role="alert"
      initial={reduceMotion ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      className={cn(
        "flex w-full items-start gap-3 rounded-2xl border border-ob-alert-line bg-ob-alert-bg px-4 py-3.5 text-ob-alert-text",
        className,
      )}
    >
      <TriangleAlert
        aria-hidden="true"
        className="mt-0.5 size-5 shrink-0"
        strokeWidth={1.5}
      />
      <p className={cn(obDetail, "break-words")}>{children}</p>
    </motion.div>
  );
}
