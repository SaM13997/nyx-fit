import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LumenShell } from "../LumenShell";
import { BarsCard, Capsule } from "../artwork";
import { lmBody, lmCaption, lmDisplay } from "../classes";
import { lumenCopy } from "../config";

export function LumenWelcomeScreen({
  onStart,
  onExistingAccount,
}: {
  onStart: () => void;
  onExistingAccount: () => void;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <LumenShell step={1} wash="welcome">
      <div className="relative -mx-6 flex flex-1 items-center justify-center px-6 py-8">
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
                  <span className={cn(lmCaption, "text-lm-ink")}>
                    {lumenCopy.welcome.art.effort}
                  </span>
                  <span className={cn(lmCaption, "text-lm-ink")}>
                    {lumenCopy.welcome.art.progress}
                  </span>
                </>
              }
              className="w-[288px] -rotate-[4deg]"
            />
          </motion.div>
          <Capsule className="absolute -right-[12px] -bottom-8">
            {lumenCopy.welcome.capsule}
          </Capsule>
        </motion.div>
      </div>
      <div className="relative flex shrink-0 flex-col">
        <h1
          tabIndex={-1}
          className={cn(lmDisplay, "mt-3 text-lm-ink focus:outline-none")}
        >
          {lumenCopy.welcome.heading}
        </h1>
        <p className={cn(lmBody, "mt-3.5 max-w-[330px]")}>
          {lumenCopy.welcome.description}
        </p>
        <Button
          type="button"
          size="xl"
          onClick={onStart}
          className="mt-7 w-full enabled:active:scale-[0.98] motion-reduce:enabled:active:scale-100"
        >
          {lumenCopy.welcome.action}
          <ArrowRight aria-hidden="true" className="size-5" strokeWidth={1.75} />
        </Button>
        <Button
          type="button"
          variant="link"
          onClick={onExistingAccount}
          className="mt-1.5 min-h-11 self-center"
        >
          {lumenCopy.welcome.existing}
        </Button>
      </div>
    </LumenShell>
  );
}
