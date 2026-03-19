import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { format } from "date-fns";
import { useMemo, useState, type ReactElement, type SVGProps } from "react";
import type { WeightEntry, WeightGoal, WeightUnit } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { convertWeightFromLbs, formatWeightUnit } from "@/lib/units";

interface WeightChartProps {
  weights: WeightEntry[];
  goal?: WeightGoal | null;
  unit: WeightUnit;
}

type TimeRange = "week" | "month" | "year";

const RANGE_CONFIG: Record<TimeRange, { label: string; days: number }> = {
  week: { label: "W", days: 7 },
  month: { label: "M", days: 30 },
  year: { label: "Y", days: 365 },
};

type ChartTickProps = SVGProps<SVGTextElement> & {
  x?: number;
  y?: number;
  payload?: { value: string | number };
  index?: number;
};

function XAxisTick(props: ChartTickProps): ReactElement {
  const { x, y, payload, index } = props;

  return (
    <text
      x={(x ?? 0) + (index === 0 ? 8 : 0)}
      y={(y ?? 0) + 14}
      fill="#71717a"
      fontSize={12}
      textAnchor={index === 0 ? "start" : "middle"}
    >
      {payload?.value}
    </text>
  );
}

function YAxisTick(props: ChartTickProps): ReactElement {
  const { x, y, payload } = props;

  return (
    <text x={(x ?? 0) - 6} y={(y ?? 0) + 4} fill="#71717a" fontSize={12} textAnchor="end">
      {payload?.value}
    </text>
  );
}

export function WeightChart({ weights, goal, unit }: WeightChartProps) {
  const [range, setRange] = useState<TimeRange>("month");

  const data = useMemo(() => {
    const now = Date.now();
    const rangeStart = now - RANGE_CONFIG[range].days * 24 * 60 * 60 * 1000;

    const filtered = weights.filter((entry) => {
      const entryTime = new Date(entry.date).getTime();
      return range === "year" ? entryTime >= rangeStart : entryTime >= rangeStart && entryTime <= now;
    });

    const source = filtered.length > 0 ? filtered : weights;

    return [...source]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((entry) => ({
        ...entry,
        weightConverted: convertWeightFromLbs(entry.weight, unit),
        dateFormatted: format(new Date(entry.date), range === "year" ? "MMM" : "MMM d"),
      }));
  }, [range, unit, weights]);

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/50">
        <p className="text-zinc-500 text-sm">No data to chart</p>
      </div>
    );
  }

  // Calculate domain padding
  const minWeight = Math.min(...data.map((d) => d.weightConverted));
  const maxWeight = Math.max(...data.map((d) => d.weightConverted));
  const domainMin = Math.floor(minWeight - 5);
  const domainMax = Math.ceil(maxWeight + 5);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">Progress</p>
          <p className="text-xs text-zinc-500">Weight trend over time in {formatWeightUnit(unit)}</p>
        </div>
        <div className="inline-flex rounded-full border border-zinc-800 bg-zinc-950/70 p-1">
          {(Object.keys(RANGE_CONFIG) as TimeRange[]).map((key) => (
            <Button
              key={key}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setRange(key)}
              className={range === key ? "bg-orange-500 text-black hover:bg-orange-400 hover:text-black" : "text-zinc-400 hover:text-white"}
            >
              {RANGE_CONFIG[key].label}
            </Button>
          ))}
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 8, left: 12 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#27272a"
              vertical={false}
            />
            <XAxis
              dataKey="dateFormatted"
              stroke="#71717a"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              minTickGap={30}
              tick={<XAxisTick />}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[domainMin, domainMax]}
              stroke="#71717a"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={38}
              tickFormatter={(value) => Math.round(value).toString()}
              tick={<YAxisTick />}
              tickMargin={10}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                borderColor: "#27272a",
                borderRadius: "12px",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
              itemStyle={{ color: "#fff" }}
              labelStyle={{ color: "#a1a1aa" }}
              formatter={(value: number) => [Math.round(value * 10) / 10, `Weight (${formatWeightUnit(unit)})`]}
            />
            {goal && (
              <ReferenceLine
                y={convertWeightFromLbs(goal.targetWeight, unit)}
                stroke="#10b981"
                strokeDasharray="3 3"
                label={{
                  value: "Goal",
                  position: "right",
                  fill: "#10b981",
                  fontSize: 12,
                }}
              />
            )}
            <Line
              type="monotone"
              dataKey="weightConverted"
              stroke="#f97316"
              strokeWidth={4}
              dot={{ r: 4, fill: "#f97316", strokeWidth: 0 }}
              activeDot={{ r: 6, strokeWidth: 0, fill: "#fff" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
