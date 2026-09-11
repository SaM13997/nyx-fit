import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { copy } from "../config";
import { CheckBadge } from "../kit/CheckBadge";
import { PrimaryButton } from "../kit/PrimaryButton";
import { ProgressRing } from "../kit/ProgressRing";
import { obBody, obMicro, obScreenTitle } from "../kit/classes";

export function DoneScreen({
  action,
  disabled = false,
  onContinue,
}: {
  action: string;
  disabled?: boolean;
  onContinue: () => void;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex flex-1 flex-col text-center">
      <div className="flex flex-1 flex-col justify-center">
        <div className="flex justify-center">
          <ProgressRing value={100} label="Setup progress">
            <motion.span
              initial={reduceMotion ? false : { scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 320, damping: 22 }}
              className="flex"
            >
              <CheckBadge size={64} />
            </motion.span>
          </ProgressRing>
        </div>
        <p className={cn(obMicro, "mt-4 text-ob-ink-secondary")}>
          Setup complete
        </p>
        <h1
          tabIndex={-1}
          className={cn(obScreenTitle, "mt-6 text-ob-ink focus:outline-none")}
        >
          {copy.done.heading}
        </h1>
        <p
          className={cn(
            obBody,
            "mx-auto mt-2 max-w-[320px] text-ob-ink-secondary",
          )}
        >
          {copy.done.description}
        </p>
      </div>
      <PrimaryButton
        onClick={onContinue}
        disabled={disabled}
        className="mt-8"
        icon={
          <ArrowRight
            aria-hidden="true"
            className="size-5"
            strokeWidth={1.5}
          />
        }
      >
        {action}
      </PrimaryButton>
    </div>
  );
}
