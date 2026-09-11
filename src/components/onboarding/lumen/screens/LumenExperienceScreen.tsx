import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExperienceLevel } from "../../config";
import { LumenBackButton } from "../LumenBackButton";
import { LumenButton } from "../LumenButton";
import { LumenChoiceCard } from "../LumenChoiceCard";
import { LumenShell } from "../LumenShell";
import { lmBody, lmScreenTitle } from "../classes";
import { lumenCopy, lumenExperienceOptions } from "../config";

export function LumenExperienceScreen({
  value,
  onChange,
  onContinue,
  onBack,
}: {
  value: ExperienceLevel | null;
  onChange: (value: ExperienceLevel) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const groupName = useId();

  return (
    <LumenShell step={2} wash="experience">
      <h1 className={cn(lmScreenTitle, "text-lm-ink")}>
        {lumenCopy.experience.heading}
      </h1>
      <p className={cn(lmBody, "mt-3 max-w-[330px]")}>
        {lumenCopy.experience.description}
      </p>

      <fieldset className="mt-8 min-w-0">
        <legend className="sr-only">{lumenCopy.experience.heading}</legend>
        <div className="space-y-5">
          {lumenExperienceOptions.map((option, index) => (
            <motion.div
              key={option.value}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.2,
                ease: "easeOut",
                delay: reduceMotion ? 0 : index * 0.04,
              }}
            >
              <LumenChoiceCard
                name={groupName}
                value={option.value}
                label={option.label}
                detail={option.detail}
                checked={value === option.value}
                onSelect={onChange}
              />
            </motion.div>
          ))}
        </div>
      </fieldset>

      <div className="mt-auto flex shrink-0 items-center gap-3 pt-6">
        <LumenBackButton onClick={onBack} />
        <div className="flex-1">
          <LumenButton
            onClick={onContinue}
            disabled={value === null}
            icon={
              <ArrowRight
                aria-hidden="true"
                className="size-5"
                strokeWidth={1.75}
              />
            }
          >
            {lumenCopy.experience.action}
          </LumenButton>
        </div>
      </div>
    </LumenShell>
  );
}
