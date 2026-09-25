import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScreenShell } from "../ScreenShell";
import { BarsCard, Capsule } from "../artwork";
import { body, caption, display } from "../classes";
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
            className={cn(display, "text-flow-ink focus:outline-none")}
          >
            {flowCopy.welcome.heading}
          </h1>
          <p className={cn(body, "mt-2.5 max-w-[330px]")}>
            {flowCopy.welcome.description}
          </p>
          <Button
            type="button"
            size="xl"
            onClick={onStart}
            className="mt-6 w-full enabled:active:scale-[0.98] motion-reduce:enabled:active:scale-100"
          >
            {flowCopy.welcome.action}
            <ArrowRight aria-hidden="true" className="size-5" strokeWidth={1.75} />
          </Button>
          <Button
            type="button"
            variant="link"
            onClick={onExistingAccount}
            className="mt-1.5 min-h-11 self-center"
          >
            {flowCopy.welcome.existing}
          </Button>
        </>
      }
    >
      <div className="relative -mx-6 flex min-h-60 flex-1 items-center justify-center px-6 py-5">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative"
        >
          <motion.div
            animate={reduceMotion ? undefined : { y: [0, -7, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          >
            <BarsCard
              heights={[20, 30, 26, 42, 54, 68]}
              tones={["rest", "rest", "lavender", "mint", "lime", "tomato"]}
              caption={
                <>
                  <span className={cn(caption, "text-flow-ink")}>
                    {flowCopy.welcome.art.effort}
                  </span>
                  <span className={cn(caption, "text-flow-ink")}>
                    {flowCopy.welcome.art.progress}
                  </span>
                </>
              }
              className="w-[288px] -rotate-[4deg]"
            />
          </motion.div>
          <Capsule className="absolute -right-[12px] -bottom-8">
            {flowCopy.welcome.capsule}
          </Capsule>
        </motion.div>
      </div>
    </ScreenShell>
  );
}
