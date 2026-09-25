import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { ExperienceLevel } from "../../config";
import { ScreenShell } from "../ScreenShell";
import { FaceMark } from "../artwork";
import { body, ctaPill, screenTitle } from "../classes";
import { flowCopy, experienceOptions } from "../config";

const optionTones: Record<
  ExperienceLevel,
  {
    panel: string;
    title: string;
    detail: string;
    mood: "calm" | "effort" | "focus";
    checkedBorder: string;
    badge: string;
    uncheckedRing: string;
  }
> = {
  beginner: {
    panel: "bg-flow-mint",
    title: "text-flow-ink",
    detail: "text-flow-ink-soft",
    mood: "calm",
    checkedBorder: "border-flow-ink/70",
    badge: "bg-flow-ink text-white",
    uncheckedRing: "border-[1.5px] border-flow-ink/30",
  },
  intermediary: {
    panel: "bg-flow-cyan",
    title: "text-flow-ink",
    detail: "text-[#0d4a56]",
    mood: "effort",
    checkedBorder: "border-flow-ink/70",
    badge: "bg-flow-ink text-white",
    uncheckedRing: "border-[1.5px] border-flow-ink/30",
  },
  advanced: {
    panel: "bg-flow-panel text-white",
    title: "text-white",
    detail: "text-white/80",
    mood: "focus",
    checkedBorder: "border-white/70",
    badge: "bg-white text-flow-ink",
    uncheckedRing: "border-[1.5px] border-white/40",
  },
};

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
          <button
            type="button"
            aria-label="Go back"
            onClick={onBack}
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-full bg-white/12 text-white",
              "enabled:active:scale-[0.98] motion-reduce:enabled:active:scale-100",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
            )}
          >
            <ChevronLeft aria-hidden="true" className="size-6" strokeWidth={2} />
          </button>
          <div className="flex-1">
            <Button
              type="button"
              variant="card"
              size="xl"
              onClick={onContinue}
              disabled={value === null}
              className={cn(
                ctaPill,
                "w-full enabled:active:scale-[0.98] motion-reduce:enabled:active:scale-100",
              )}
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

      <RadioGroup
        value={value ?? ""}
        onValueChange={handleChange}
        className="mt-4 gap-2.5"
        aria-label={flowCopy.experience.heading}
      >
        {experienceOptions.map((option, index) => {
          const tone = optionTones[option.value];
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
              <label
                htmlFor={`level-${option.value}`}
                className={cn(
                  "relative flex w-full cursor-pointer items-center min-h-[64px] gap-3 rounded-[22px] border px-4 py-3",
                  "flow-shadow-card transition-[border-color,box-shadow] duration-200 motion-reduce:transition-none",
                  "active:scale-[0.99] motion-reduce:active:scale-100",
                  "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-flow-ink",
                  tone.panel,
                  checked ? tone.checkedBorder : "border-transparent",
                )}
              >
                <span
                  aria-hidden="true"
                  className="w-11 shrink-0 opacity-90 transition-opacity duration-150 motion-reduce:transition-none"
                >
                  <FaceMark mood={tone.mood} className="w-full" />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "flex items-center gap-1.5",
                      "text-[17px] leading-[22px] font-semibold",
                      tone.title,
                    )}
                  >
                    {option.label}
                  </span>
                  <span
                    id={`level-${option.value}-description`}
                    className={cn("block text-[14px] leading-5", tone.detail)}
                  >
                    {option.detail}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full",
                    checked
                      ? tone.badge
                      : tone.uncheckedRing,
                  )}
                >
                  {checked ? (
                    <Check className="size-4" strokeWidth={3} />
                  ) : null}
                </span>
                <RadioGroupItem
                  id={`level-${option.value}`}
                  value={option.value}
                  aria-label={option.label}
                  aria-describedby={`level-${option.value}-description`}
                  className="sr-only"
                />
              </label>
            </motion.div>
          );
        })}
      </RadioGroup>
    </ScreenShell>
  );
}
