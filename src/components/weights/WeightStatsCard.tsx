import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import type { WeightEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

interface WeightStatsCardProps {
  currentWeight?: number;
  startWeight?: number;
  height?: number; // in cm, for BMI
}

export function WeightStatsCard({
  currentWeight,
  startWeight,
  height,
}: WeightStatsCardProps) {
  if (!currentWeight) {
    return (
      <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800/50 backdrop-blur-sm">
        <p className="text-zinc-400 text-center">Log your weight to see stats</p>
      </div>
    );
  }

  const change = startWeight ? currentWeight - startWeight : 0;
  const isLoss = change < 0;
  const isGain = change > 0;

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Current Weight */}
      <div className="col-span-2 p-6 rounded-3xl bg-linear-to-br from-zinc-900 to-zinc-950 border border-zinc-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center">
          <span className="text-zinc-500 text-xs uppercase tracking-wider font-bold mb-1">Current Weight</span>
          <div className="flex items-baseline gap-1">
            <span className="text-6xl font-black text-white tracking-tighter">{currentWeight}</span>
            <span className="text-orange-500 font-bold">lbs</span>
          </div>
        </div>

        {/* Decorative background glow - ORANGE */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl opacity-50" />
      </div>

      {/* Change */}
      <div className="p-4 rounded-[2rem] bg-zinc-900/50 border border-zinc-800 flex flex-col items-center justify-center backdrop-blur-xs">
        <span className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold mb-1">Total Change</span>
        <div className={cn("flex items-center gap-1 font-bold text-xl", {
          "text-emerald-400": isLoss,
          "text-rose-400": isGain,
          "text-zinc-400": !isLoss && !isGain
        })}>
          {isLoss && <TrendingDown className="w-4 h-4" />}
          {isGain && <TrendingUp className="w-4 h-4" />}
          {!isLoss && !isGain && <Minus className="w-4 h-4" />}
          <span>{Math.abs(change).toFixed(1)}</span>
        </div>
      </div>

      {/* Start */}
      <div className="p-4 rounded-[2rem] bg-zinc-900/50 border border-zinc-800 flex flex-col items-center justify-center backdrop-blur-xs">
        <span className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold mb-1">Starting</span>
        <div className="font-bold text-xl text-white">
          {startWeight ?? "-"}
        </div>
      </div>
    </div>
  );
}
