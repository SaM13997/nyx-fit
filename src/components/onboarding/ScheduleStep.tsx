import { Check, ArrowRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  actionClass,
  copy,
  dayOptions,
  defaultDays,
  equipmentOptions,
  focusClass,
  headingClass,
  type QuizAnswers,
} from "./config";

type ScheduleStepProps = {
  answers: QuizAnswers;
  onChange: (answers: QuizAnswers) => void;
  onContinue: () => void;
};

export function ScheduleStep({
  answers,
  onChange,
  onContinue,
}: ScheduleStepProps) {
  const days = answers.daysPerWeek ?? defaultDays(answers.lastWeekSessions);
  return (
    <div>
      <h1 tabIndex={-1} className={headingClass}>
        {copy.schedule.heading}
      </h1>
      <fieldset className="mt-9">
        <legend className="mb-4 text-base font-semibold">
          {copy.schedule.days}
        </legend>
        <div className="grid grid-cols-4 gap-3">
          {dayOptions.map((day) => (
            <label
              key={day}
              className={cn(
                "relative flex min-h-20 cursor-pointer flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-colors focus-within:ring-2 focus-within:ring-purple-500 focus-within:ring-offset-2 focus-within:ring-offset-black motion-reduce:transition-none",
                day === days && "border-purple-500 bg-purple-500/10",
              )}
            >
              <input
                type="radio"
                name="days"
                value={day}
                checked={day === days}
                onChange={() => onChange({ ...answers, daysPerWeek: day })}
                className="sr-only"
              />
              <span className="text-3xl font-semibold tabular-nums">{day}</span>{" "}
              <span className="text-xs text-zinc-400">days</span>
              {day === days && (
                <Check
                  aria-hidden="true"
                  className="absolute right-1.5 top-1.5 size-3.5 text-purple-300"
                />
              )}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="mt-9">
        <legend className="mb-4 text-base font-semibold">
          {copy.schedule.equipment}
        </legend>
        <div className="flex flex-wrap gap-3">
          {equipmentOptions.map(({ value, label }) => {
            const selected = answers.equipment.includes(value);
            return (
              <button
                key={value}
                type="button"
                aria-pressed={selected}
                onClick={() =>
                  onChange({
                    ...answers,
                    equipment: selected
                      ? answers.equipment.filter((item) => item !== value)
                      : [...answers.equipment, value],
                  })
                }
                className={cn(
                  "flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm transition-colors motion-reduce:transition-none",
                  focusClass,
                  selected && "border-purple-500 bg-purple-500/10",
                )}
              >
                {selected ? (
                  <Check aria-hidden="true" className="size-4" />
                ) : (
                  <Plus aria-hidden="true" className="size-4 text-zinc-400" />
                )}
                {label}
              </button>
            );
          })}
        </div>
      </fieldset>
      <button type="button" onClick={onContinue} className={actionClass}>
        {copy.schedule.action}
        <ArrowRight aria-hidden="true" className="size-5" />
      </button>
    </div>
  );
}
