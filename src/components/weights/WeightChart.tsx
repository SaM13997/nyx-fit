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
import type { WeightEntry, WeightGoal } from "@/lib/types";

interface WeightChartProps {
  weights: WeightEntry[];
  goal?: WeightGoal | null;
}

export function WeightChart({ weights, goal }: WeightChartProps) {
  // Process data: sort by date ascending for chart
  const data = [...weights]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((entry) => ({
      ...entry,
      dateFormatted: format(new Date(entry.date), "MMM d"),
    }));

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/50">
        <p className="text-zinc-500 text-sm">No data to chart</p>
      </div>
    );
  }

  // Calculate domain padding
  const minWeight = Math.min(...data.map((d) => d.weight));
  const maxWeight = Math.max(...data.map((d) => d.weight));
  const domainMin = Math.floor(minWeight - 5);
  const domainMax = Math.ceil(maxWeight + 5);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#27272a" // zinc-800
            vertical={false}
          />
          <XAxis
            dataKey="dateFormatted"
            stroke="#71717a" // zinc-500
            fontSize={12}
            tickLine={false}
            axisLine={false}
            minTickGap={30}
          />
          <YAxis
            domain={[domainMin, domainMax]}
            stroke="#71717a" // zinc-500
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={30}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#18181b", // zinc-900
              borderColor: "#27272a", // zinc-800
              borderRadius: "12px",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.1)"
            }}
            itemStyle={{ color: "#fff" }}
            labelStyle={{ color: "#a1a1aa" }} // zinc-400
          />
          {goal && (
            <ReferenceLine
              y={goal.targetWeight}
              stroke="#10b981" // emerald-500
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
            dataKey="weight"
            stroke="#f97316" // orange-500
            strokeWidth={4}
            dot={{ r: 4, fill: "#f97316", strokeWidth: 0 }}
            activeDot={{ r: 6, strokeWidth: 0, fill: "#fff" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
