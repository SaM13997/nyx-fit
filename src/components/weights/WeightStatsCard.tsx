import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import type { WeightUnit } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatWeight, formatWeightUnit } from "@/lib/units";

interface WeightStatsCardProps {
  currentWeight?: number;
  startWeight?: number;
  unit: WeightUnit;
  height?: number; // in cm, for BMI
}

export function WeightStatsCard({
  currentWeight,
  startWeight,
  unit,
}: WeightStatsCardProps) {
  if (!currentWeight) {
    return (
      <div className="p-6 rounded-3xl bg-card border border-border backdrop-blur-sm">
        <p className="text-muted-foreground text-center">Log your weight to see stats</p>
      </div>
    );
  }

  const change = startWeight ? currentWeight - startWeight : 0;
  const isLoss = change < 0;
  const isGain = change > 0;

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Current Weight */}
      <div className="col-span-2 p-6 rounded-3xl bg-linear-to-br from-card to-background border border-border relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center">
          <span className="text-ink-subtle text-xs uppercase tracking-wider font-bold mb-1">Current Weight</span>
          <div className="flex items-baseline gap-1">
            <span className="text-6xl font-black text-foreground tracking-tighter">{formatWeight(currentWeight, unit)}</span>
            <span className="text-orange-700 dark:text-orange-500 font-bold">{formatWeightUnit(unit)}</span>
          </div>
        </div>

        {/* Decorative background glow - ORANGE */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl opacity-50" />
      </div>

      {/* Change */}
      <div className="p-4 rounded-[2rem] bg-card border border-border flex flex-col items-center justify-center backdrop-blur-xs">
        <span className="text-ink-subtle text-[10px] uppercase tracking-widest font-bold mb-1">Total Change</span>
        <div className={cn("flex items-center gap-1 font-bold text-xl", {
          "text-success-ink": isLoss,
          "text-rose-700 dark:text-rose-400": isGain,
          "text-muted-foreground": !isLoss && !isGain
        })}>
          {isLoss && <TrendingDown className="w-4 h-4" />}
          {isGain && <TrendingUp className="w-4 h-4" />}
          {!isLoss && !isGain && <Minus className="w-4 h-4" />}
          <span>{formatWeight(Math.abs(change), unit)}</span>
        </div>
      </div>

      {/* Start */}
      <div className="p-4 rounded-[2rem] bg-card border border-border flex flex-col items-center justify-center backdrop-blur-xs">
        <span className="text-ink-subtle text-[10px] uppercase tracking-widest font-bold mb-1">Starting</span>
        <div className="font-bold text-xl text-foreground">
          {startWeight !== undefined ? formatWeight(startWeight, unit) : "-"}
        </div>
      </div>
    </div>
  );
}
