import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { ExperienceLevel } from "../../config";
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

  const handleChange = (next: string) => {
    const option = lumenExperienceOptions.find((item) => item.value === next);
    if (option) onChange(option.value);
  };

  return (
    <LumenShell step={2} wash="experience">
      <h1 className={cn(lmScreenTitle, "text-lm-ink")}>
        {lumenCopy.experience.heading}
      </h1>
      <p className={cn(lmBody, "mt-3 max-w-[330px]")}>
        {lumenCopy.experience.description}
      </p>

      <FieldSet className="mt-8 min-w-0">
        <FieldLegend className="sr-only">
          {lumenCopy.experience.heading}
        </FieldLegend>
        <RadioGroup
          value={value ?? ""}
          onValueChange={handleChange}
          className="gap-5"
        >
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
              <FieldLabel htmlFor={`lumen-level-${option.value}`}>
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldTitle>{option.label}</FieldTitle>
                    <FieldDescription>{option.detail}</FieldDescription>
                  </FieldContent>
                  <RadioGroupItem
                    id={`lumen-level-${option.value}`}
                    value={option.value}
                    aria-label={option.label}
                  />
                </Field>
              </FieldLabel>
            </motion.div>
          ))}
        </RadioGroup>
      </FieldSet>

      <div className="mt-auto flex shrink-0 items-center gap-3 pt-6">
        <Button
          type="button"
          variant="outline"
          size="icon-xl"
          aria-label="Go back"
          onClick={onBack}
        >
          <ChevronLeft aria-hidden="true" className="size-6" strokeWidth={2} />
        </Button>
        <div className="flex-1">
          <Button
            type="button"
            size="xl"
            onClick={onContinue}
            disabled={value === null}
            className="w-full"
          >
            {lumenCopy.experience.action}
            <ArrowRight
              aria-hidden="true"
              className="size-5"
              strokeWidth={1.75}
            />
          </Button>
        </div>
      </div>
    </LumenShell>
  );
}
