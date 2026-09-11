import { BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { obDataLabel, obMicro, obSectionTitle } from "./classes";
import { StatusChip } from "./StatusChip";

const bars = [
  { day: "Monday", value: 34 },
  { day: "Tuesday", value: 52 },
  { day: "Wednesday", value: 46 },
  { day: "Thursday", value: 68 },
  { day: "Friday", value: 58 },
  { day: "Saturday", value: 76 },
  { day: "Sunday", value: 62 },
];

const weekdayInitials = ["M", "T", "W", "T", "F", "S", "S"];
const EMPHASIS_INDEX = 5;

export function MiniBarChart({ className }: { className?: string }) {
  return (
    <div className={cn("ob-shadow-rest w-full rounded-[28px] bg-ob-card p-6", className)}>
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ob-soft text-ob-ink">
          <BarChart3 aria-hidden="true" className="size-5" strokeWidth={1.5} />
        </span>
        <h3 className={cn("flex-1 text-ob-ink", obSectionTitle)}>
          Weekly volume
        </h3>
        <StatusChip tone="positive">On track</StatusChip>
      </div>
      <div aria-hidden="true">
        <div className="mt-6 flex h-[100px] items-end gap-2">
          {bars.map((bar, index) => (
            <div
              key={bar.day}
              className="flex flex-1 flex-col items-center justify-end gap-1.5"
            >
              <span
                className={cn(
                  obDataLabel,
                  "tabular-nums text-ob-ink-secondary",
                )}
              >
                {bar.value}
              </span>
              <div
                style={{ height: bar.value }}
                className={cn(
                  "w-full max-w-[26px] rounded-t-[10px] rounded-b-[2px]",
                  index === EMPHASIS_INDEX ? "bg-ob-coral" : "bg-ob-bar-rest",
                )}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          {weekdayInitials.map((initial, index) => (
            <span
              key={`${initial}-${index}`}
              className={cn(
                obMicro,
                "flex-1 text-center text-ob-ink-secondary",
              )}
            >
              {initial}
            </span>
          ))}
        </div>
      </div>
      <ul className="sr-only">
        {bars.map((bar) => (
          <li key={bar.day}>
            {bar.day}: {bar.value}
          </li>
        ))}
      </ul>
    </div>
  );
}
