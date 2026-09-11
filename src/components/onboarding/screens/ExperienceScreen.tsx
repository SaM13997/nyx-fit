import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  copy,
  experienceOptions,
  type ExperienceLevel,
} from "../config";
import { OptionCard } from "../kit/OptionCard";
import { PrimaryButton } from "../kit/PrimaryButton";
import { obBody, obScreenTitle } from "../kit/classes";

export function ExperienceScreen({
  value,
  onChange,
  onContinue,
}: {
  value: ExperienceLevel | null;
  onChange: (value: ExperienceLevel) => void;
  onContinue: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const descriptionId = useId();

  return (
    <div className="flex flex-1 flex-col">
      <fieldset aria-describedby={descriptionId}>
        <legend className="w-full">
          <h1
            tabIndex={-1}
            className={cn(
              obScreenTitle,
              "max-w-[320px] text-ob-ink focus:outline-none",
            )}
          >
            {copy.experience.heading}
          </h1>
        </legend>
        <p
          id={descriptionId}
          className={cn(obBody, "mt-2 mb-6 max-w-[320px] text-ob-ink-secondary")}
        >
          {copy.experience.description}
        </p>
        <div className="space-y-3">
          {experienceOptions.map((option, index) => (
            <motion.div
              key={option.value}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.16,
                ease: "easeOut",
                delay: reduceMotion ? 0 : index * 0.04,
              }}
            >
              <OptionCard
                name="experience"
                value={option.value}
                label={option.label}
                detail={option.detail}
                index={index}
                checked={value === option.value}
                onSelect={() => onChange(option.value)}
              />
            </motion.div>
          ))}
        </div>
      </fieldset>
      <div className="mt-auto pt-8">
        <PrimaryButton onClick={onContinue} disabled={value === null}>
          {copy.experience.action}
        </PrimaryButton>
      </div>
    </div>
  );
}
