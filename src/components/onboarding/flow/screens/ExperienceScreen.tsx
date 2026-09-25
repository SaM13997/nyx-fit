import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, ChevronLeft } from "lucide-react";
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
import { ScreenShell } from "../ScreenShell";
import { body, screenTitle } from "../classes";
import { flowCopy, experienceOptions } from "../config";

export function ExperienceScreen({
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
    const option = experienceOptions.find((item) => item.value === next);
    if (option) onChange(option.value);
  };

  return (
    <ScreenShell
      step={2}
      footer={
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon-xl"
            aria-label="Go back"
            onClick={onBack}
            className="enabled:active:scale-[0.98] motion-reduce:enabled:active:scale-100"
          >
            <ChevronLeft aria-hidden="true" className="size-6" strokeWidth={2} />
          </Button>
          <div className="flex-1">
            <Button
              type="button"
              size="xl"
              onClick={onContinue}
              disabled={value === null}
              className="w-full enabled:active:scale-[0.98] motion-reduce:enabled:active:scale-100"
            >
              {flowCopy.experience.action}
              <ArrowRight
                aria-hidden="true"
                className="size-5"
                strokeWidth={1.75}
              />
            </Button>
          </div>
        </div>
      }
    >
      <h1
        tabIndex={-1}
        className={cn(screenTitle, "text-flow-ink focus:outline-none")}
      >
        {flowCopy.experience.heading}
      </h1>
      <p className={cn(body, "mt-2.5 max-w-[330px]")}>
        {flowCopy.experience.description}
      </p>

      <FieldSet className="mt-5 min-w-0">
        <FieldLegend className="sr-only">
          {flowCopy.experience.heading}
        </FieldLegend>
        <RadioGroup
          value={value ?? ""}
          onValueChange={handleChange}
          className="gap-4"
        >
          {experienceOptions.map((option, index) => {
            const checked = value === option.value;
            return (
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
                <FieldLabel
                  htmlFor={`level-${option.value}`}
                  className={cn(
                    "relative cursor-pointer items-center bg-flow-card",
                    "transition-[background-color,border-color,transform] duration-200 motion-reduce:transition-none active:scale-[0.99] motion-reduce:active:scale-100",
                    "has-data-[state=checked]:border-flow-ink/15",
                    "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-flow-ink",
                  )}
                >
                  <Field orientation="horizontal">
                    <FieldContent className="min-w-0">
                      <FieldTitle>{option.label}</FieldTitle>
                      <FieldDescription
                        id={`level-${option.value}-description`}
                      >
                        {option.detail}
                      </FieldDescription>
                    </FieldContent>
                    <span
                      aria-hidden="true"
                      className="relative flex size-8 shrink-0 items-center justify-center"
                    >
                      {checked ? (
                        <motion.span
                          initial={reduceMotion ? false : { scale: 0.7 }}
                          animate={{ scale: 1 }}
                          transition={{
                            type: "spring",
                            stiffness: 320,
                            damping: 22,
                          }}
                          className="flex size-8 items-center justify-center rounded-full bg-flow-lime text-flow-ink"
                        >
                          <Check className="size-[18px]" strokeWidth={3} />
                        </motion.span>
                      ) : (
                        <span className="block size-7 rounded-full border-[1.5px] border-flow-ink-faint" />
                      )}
                    </span>
                    <RadioGroupItem
                      id={`level-${option.value}`}
                      value={option.value}
                      aria-label={option.label}
                      aria-describedby={`level-${option.value}-description`}
                      className="sr-only"
                    />
                  </Field>
                </FieldLabel>
              </motion.div>
            );
          })}
        </RadioGroup>
      </FieldSet>
    </ScreenShell>
  );
}
