import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { copy } from "../config";
import { PrimaryButton } from "../kit/PrimaryButton";
import { TextLink } from "../kit/TextLink";
import { obBody, obHeroTitle } from "../kit/classes";

const ART_HEIGHTS = [24, 36, 30, 48, 42, 60, 72];
const EMPHASIS_INDEX = ART_HEIGHTS.length - 1;

export function WelcomeScreen({
  onStart,
  onExistingAccount,
}: {
  onStart: () => void;
  onExistingAccount: () => void;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex flex-1 flex-col">
      <div
        aria-hidden="true"
        className="relative mx-auto flex w-full max-w-[280px] flex-1 items-end justify-center pb-8"
      >
        <motion.div
          initial={reduceMotion ? false : { scale: 0.98 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
          className="ob-shadow-float w-[264px] -rotate-3 rounded-3xl bg-ob-card p-5"
        >
          <div className="flex h-[76px] items-end gap-1.5">
            {ART_HEIGHTS.map((height, index) => (
              <motion.div
                key={`${height}-${index}`}
                initial={reduceMotion ? false : { scaleY: 0.4, opacity: 0 }}
                animate={{ scaleY: 1, opacity: 1 }}
                transition={
                  index === EMPHASIS_INDEX
                    ? {
                        type: "spring",
                        stiffness: 260,
                        damping: 24,
                        delay: 0.1,
                      }
                    : { duration: 0.3, ease: "easeOut" }
                }
                style={{ height, transformOrigin: "bottom" }}
                className={cn(
                  "flex-1 rounded-t-[10px] rounded-b-[2px]",
                  index === EMPHASIS_INDEX ? "bg-ob-coral" : "bg-ob-bar-rest",
                )}
              />
            ))}
          </div>
          <div className="mt-3 flex justify-between border-t border-ob-hairline pt-3 text-[13px] leading-[18px] font-semibold tracking-[0.01em] text-ob-ink-secondary">
            <span>Your effort.</span>
            <span>Your progress.</span>
          </div>
        </motion.div>
      </div>
      <div>
        <h1
          tabIndex={-1}
          className={cn(
            obHeroTitle,
            "max-w-[320px] text-ob-ink focus:outline-none",
          )}
        >
          {copy.welcome.heading}
        </h1>
        <p
          className={cn(obBody, "mt-2 max-w-[320px] text-ob-ink-secondary")}
        >
          {copy.welcome.description}
        </p>
        <PrimaryButton
          onClick={onStart}
          className="mt-6"
          icon={
            <ArrowRight
              aria-hidden="true"
              className="size-5"
              strokeWidth={1.5}
            />
          }
        >
          {copy.welcome.action}
        </PrimaryButton>
        <TextLink onClick={onExistingAccount} className="mx-auto mt-2 flex">
          {copy.welcome.skip}
        </TextLink>
      </div>
    </div>
  );
}
