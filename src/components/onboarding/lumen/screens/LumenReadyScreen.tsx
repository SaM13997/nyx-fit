import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ExperienceLevel } from "../../config";
import { LumenShell } from "../LumenShell";
import { LevelBarsIcon, RingsArt } from "../artwork";
import { lmScreenTitle } from "../classes";
import { lumenCopy, lumenLevelLabel } from "../config";

export function LumenReadyScreen({
  level,
  onOpenDashboard,
}: {
  level: ExperienceLevel | null;
  onOpenDashboard: () => void;
}) {
  return (
    <LumenShell step={4} wash="ready">
      <div className="flex min-h-full flex-col items-center text-center">
        <div className="flex flex-1 items-center justify-center py-2">
          <RingsArt />
        </div>

        <h1 className={cn(lmScreenTitle, "mt-3 text-lm-ink")}>
          {lumenCopy.ready.heading}
        </h1>

        <div className="lm-shadow-card mt-6 flex w-full items-center gap-3.5 rounded-[20px] border border-lm-line bg-white p-4 text-left">
          <span aria-hidden="true" className="shrink-0 text-lm-forest">
            <LevelBarsIcon count={3} tone="lime" className="size-7" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[12px] leading-4 text-lm-ink-faint">
              {lumenCopy.save.cardLabel}
            </span>
            <span className="block text-[15px] leading-5 font-bold text-lm-ink">
              {lumenLevelLabel(level)}
            </span>
          </span>
          <span
            aria-hidden="true"
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-lm-lime text-lm-ink"
          >
            <Check className="size-4" strokeWidth={3} />
          </span>
        </div>

        <div className="mt-auto w-full shrink-0 pt-6">
          <Button
            type="button"
            size="xl"
            onClick={onOpenDashboard}
            className="w-full"
          >
            {lumenCopy.ready.action}
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
