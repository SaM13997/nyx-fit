import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { obDataLabel, obNumberL } from "./classes";
import { PillChip } from "./PillChip";

export function DarkDataCard({ className }: { className?: string }) {
  return (
    <div
      className={cn("ob-shadow-float w-full rounded-[28px] bg-ob-ink p-6 text-white", className)}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10">
          <Activity aria-hidden="true" className="size-5" strokeWidth={1.5} />
        </span>
        <PillChip variant="inverse">On track</PillChip>
      </div>
      <p className={cn(obDataLabel, "mt-6 text-white/[0.72]")}>
        Sets this week
      </p>
      <p className={cn(obNumberL, "mt-1 text-white")}>148</p>
    </div>
  );
}
