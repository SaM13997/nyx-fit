import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScreenShell } from "../ScreenShell";
import { body, ctaPill, display, focusRingLight } from "../classes";
import { flowCopy } from "../config";

export function WelcomeScreen({
  onStart,
  onExistingAccount,
}: {
  onStart: () => void;
  onExistingAccount: () => void;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <ScreenShell
      step={1}
      footer={
        <>
          <h1
            tabIndex={-1}
            className={cn(display, "text-white focus:outline-none")}
          >
            {flowCopy.welcome.heading}
          </h1>
          <p className={cn(body, "mt-2.5 max-w-[330px] text-white/80")}>
            {flowCopy.welcome.description}
          </p>
          <Button
            type="button"
            variant="card"
            size="xl"
            onClick={onStart}
            className={cn(
              ctaPill,
              "mt-6 w-full enabled:active:scale-[0.98] motion-reduce:enabled:active:scale-100",
            )}
          >
            {flowCopy.welcome.action}
            <ArrowRight aria-hidden="true" className="size-5" strokeWidth={1.75} />
          </Button>
          <button
            type="button"
            onClick={onExistingAccount}
            className={cn(
              focusRingLight,
              "mt-1.5 flex w-full min-h-11 items-center justify-center self-center rounded-full text-[14px] leading-5 font-semibold text-white/85 hover:text-white",
            )}
          >
            {flowCopy.welcome.existing}
          </button>
        </>
      }
    >
      <motion.div
        aria-hidden="true"
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flow-shadow-card mx-auto mt-2 flex h-9 items-center gap-2.5 rounded-full bg-white/85 pr-4 pl-2.5 text-flow-ink"
      >
        <span className="flex size-[22px] items-center justify-center rounded-full bg-flow-cyan">
          <span className="size-2 rounded-full bg-flow-ink" />
        </span>
        <span className="text-[12px] leading-4 font-semibold">
          {flowCopy.welcome.capsule}
        </span>
      </motion.div>
    </ScreenShell>
  );
}
