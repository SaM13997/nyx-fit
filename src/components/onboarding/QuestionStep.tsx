import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { actionClass, headingClass, type QuestionOption } from "./config";

type QuestionStepProps<T extends string> = {
  name: string;
  heading: string;
  description: string;
  action: string;
  options: QuestionOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  onContinue: () => void;
};

export function QuestionStep<T extends string>({
  name,
  heading,
  description,
  action,
  options,
  value,
  onChange,
  onContinue,
}: QuestionStepProps<T>) {
  return (
    <div>
      <fieldset aria-describedby={`${name}-description`}>
        <legend className="mb-4 w-full">
          <h1 tabIndex={-1} className={headingClass}>
            {heading}
          </h1>
        </legend>
        <p
          id={`${name}-description`}
          className="mb-8 text-base leading-relaxed text-zinc-400"
        >
          {description}
        </p>
        <div className="space-y-3">
          {options.map((option, index) => (
            <motion.label
              key={option.value}
              whileTap={{ scale: 0.97 }}
              className={cn(
                "flex min-h-11 cursor-pointer items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 transition-colors duration-150 focus-within:ring-2 focus-within:ring-purple-500 focus-within:ring-offset-2 focus-within:ring-offset-black motion-reduce:transition-none",
                value === option.value && "border-purple-500 bg-purple-500/10",
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className="text-xs tabular-nums text-zinc-400"
              >
                0{index + 1}
              </span>
              <span className="flex-1">
                <span className="block text-lg font-semibold">
                  {option.label}
                </span>
                <span className="text-sm text-zinc-400">{option.detail}</span>
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border border-zinc-500",
                  value === option.value && "border-purple-500 bg-purple-600",
                )}
              >
                {value === option.value && <Check className="size-4" />}
              </span>
            </motion.label>
          ))}
        </div>
      </fieldset>
      <button
        type="button"
        onClick={onContinue}
        disabled={value === null}
        className={actionClass}
      >
        {action}
        <ArrowRight aria-hidden="true" className="size-5" />
      </button>
    </div>
  );
}
