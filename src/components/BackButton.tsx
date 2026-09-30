import { useRouter } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";

import type { NavHref } from "@/config/navigation";
import { pressScale } from "@/lib/motion";
import { cn } from "@/lib/utils";

type BackButtonProps = {
  // Where to go when the screen was opened directly (no in-app history).
  fallback: NavHref;
  className?: string;
};

// Pops the in-app stack like a native back button, so the route transition
// plays as a pop and history does not keep growing.
export function BackButton({ fallback, className }: BackButtonProps) {
  const router = useRouter();

  return (
    <motion.button
      type="button"
      aria-label="Back"
      whileTap={pressScale}
      onClick={() => {
        if (router.history.canGoBack()) router.history.back();
        else void router.navigate({ to: fallback, replace: true });
      }}
      className={cn(
        "flex h-11 w-11 items-center justify-center rounded-full border border-border bg-glass text-foreground backdrop-blur-xl transition-colors hover:bg-fill-strong",
        className
      )}
    >
      <ChevronLeft className="h-5 w-5" />
    </motion.button>
  );
}
