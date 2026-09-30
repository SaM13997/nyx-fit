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
import {
  CHART_RANGES,
  RANGE_CONFIG,
  filterWeightsForRange,
  integerTicks,
  sortByDateAsc,
  type ChartRange,
} from "@/lib/chartRanges";

interface WeightChartProps {
  weights: WeightEntry[];
  goal?: WeightGoal | null;
  unit: WeightUnit;
}

type ChartTickProps = SVGProps<SVGTextElement> & {
  x?: number;
  y?: number;
  payload?: { value: string | number };
};

function XAxisTick(props: ChartTickProps): ReactElement {
  const { x, y, payload } = props;

  return (
    <text
      x={x ?? 0}
      y={(y ?? 0) + 14}
      fill="var(--color-muted-foreground)"
      fontSize={12}
      textAnchor="middle"
    >
      {payload?.value}
    </text>
  );
}

function YAxisTick(props: ChartTickProps): ReactElement {
  const { x, y, payload } = props;

  return (
    <text x={(x ?? 0) - 6} y={(y ?? 0) + 4} fill="var(--color-muted-foreground)" fontSize={12} textAnchor="end">
      {payload?.value}
    </text>
  );
}

const CHART_MARGIN = { top: 8, right: 16, bottom: 8, left: 0 };

type RangeHeaderProps = {
  range: ChartRange;
  onRangeChange: (range: ChartRange) => void;
  unit: WeightUnit;
};

function RangeHeader({ range, onRangeChange, unit }: RangeHeaderProps): ReactElement {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-semibold text-foreground">Progress</p>
        <p className="text-xs text-ink-subtle">Weight trend over time in {formatWeightUnit(unit)}</p>
      </div>
      <div className="inline-flex rounded-full border border-border bg-glass p-1">
        {CHART_RANGES.map((key) => (
          <Button
            key={key}
            type="button"
            variant="ghost"
            size="sm"
            aria-pressed={range === key}
            onClick={() => onRangeChange(key)}
            className={
              range === key
                ? "min-h-11 bg-orange-500 text-zinc-950 hover:bg-orange-400 hover:text-zinc-950"
                : "min-h-11 text-muted-foreground hover:text-foreground"
            }
          >
            {RANGE_CONFIG[key].label}
          </Button>
        ))}
      </div>
    </div>
  );
}

export function WeightChart({ weights, goal, unit }: WeightChartProps) {
  const [range, setRange] = useState<ChartRange>("month");

  const data = useMemo(() => {
    const inRange = filterWeightsForRange(weights, range, Date.now());
    return sortByDateAsc(inRange).map((entry) => ({
      ...entry,
      weightConverted: convertWeightFromLbs(entry.weight, unit),
      dateFormatted: format(new Date(entry.date), range === "year" ? "MMM" : "MMM d"),
    }));
  }, [range, unit, weights]);

  if (weights.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center border border-dashed border-border rounded-xl bg-card">
        <p className="text-ink-subtle text-sm">No data to chart</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="space-y-4">
        <RangeHeader range={range} onRangeChange={setRange} unit={unit} />
        <div className="h-64 flex items-center justify-center border border-dashed border-border rounded-xl bg-card">
          <p className="text-ink-subtle text-sm">No weigh-ins in this range</p>
        </div>
      </div>
    );
  }

  const minWeight = Math.min(...data.map((d) => d.weightConverted));
  const maxWeight = Math.max(...data.map((d) => d.weightConverted));
  const domainMin = Math.floor(minWeight - 5);
  const domainMax = Math.ceil(maxWeight + 5);
  const ticks = integerTicks(domainMin, domainMax);

  return (
    <div className="space-y-4">
      <RangeHeader range={range} onRangeChange={setRange} unit={unit} />

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={CHART_MARGIN}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              vertical={false}
            />
            <XAxis
              dataKey="dateFormatted"
              stroke="var(--color-muted-foreground)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              minTickGap={30}
              tick={<XAxisTick />}
              interval="preserveStartEnd"
              padding={{ left: 12, right: 12 }}
            />
            <YAxis
              domain={[domainMin, domainMax]}
              ticks={ticks}
              stroke="var(--color-muted-foreground)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={44}
              tickFormatter={(value) => Math.round(value).toString()}
              tick={<YAxisTick />}
              tickMargin={10}
            />
            <Tooltip
              contentStyle={{
                background: "var(--color-popover)",
                borderColor: "var(--color-border)",
                borderRadius: "12px",
                color: "var(--color-popover-foreground)",
                border: "1px solid var(--color-border)",
              }}
              itemStyle={{ color: "var(--color-popover-foreground)" }}
              labelStyle={{ color: "var(--color-muted-foreground)" }}
              formatter={(value) => [typeof value === "number" ? Math.round(value * 10) / 10 : "—", `Weight (${formatWeightUnit(unit)})`]}
            />
            {goal && (
              <ReferenceLine
                y={convertWeightFromLbs(goal.targetWeight, unit)}
                stroke="var(--color-series-weight)"
                strokeDasharray="3 3"
                label={{
                  value: "Goal",
                  position: "right",
                  fill: "var(--color-series-weight)",
                  fontSize: 12,
                }}
              />
            )}
            <Line
              type="monotone"
              dataKey="weightConverted"
              stroke="var(--color-series-accent)"
              strokeWidth={4}
              dot={{ r: 4, fill: "var(--color-series-accent)", strokeWidth: 0 }}
              activeDot={{ r: 6, strokeWidth: 0, fill: "var(--color-white)" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
