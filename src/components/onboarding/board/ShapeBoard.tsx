import { cn } from "@/lib/utils";
import { obCaption, obDataLabel } from "../kit/classes";

type RadiusStep = {
  value: string;
  use: string;
  className: string;
};

type ElevationStep = {
  name: string;
  use: string;
  value: string;
  className: string;
};

const radiusSteps: RadiusStep[] = [
  { value: "16", use: "Button, alert, day square", className: "rounded-2xl" },
  { value: "20", use: "Option card", className: "rounded-[20px]" },
  { value: "24", use: "Standard card", className: "rounded-3xl" },
  { value: "28", use: "Hero card", className: "rounded-[28px]" },
];

const elevationSteps: ElevationStep[] = [
  {
    name: "shadow-rest",
    use: "White cards at rest, icon buttons",
    value: "0 1px 2px rgba(23,23,26,0.04) · 0 8px 24px rgba(23,23,26,0.06)",
    className: "ob-shadow-rest",
  },
  {
    name: "shadow-float",
    use: "Selected card, dark card, floating nav",
    value: "0 2px 6px rgba(23,23,26,0.05) · 0 16px 40px rgba(23,23,26,0.10)",
    className: "ob-shadow-float",
  },
  {
    name: "shadow-action",
    use: "Primary button only",
    value: "0 8px 20px rgba(23,23,26,0.18)",
    className: "ob-shadow-action",
  },
];

const spacingSteps = [4, 8, 12, 16, 20, 24, 32, 40, 56];

export function ShapeBoard() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <p className={cn(obDataLabel, "text-ob-ink-secondary")}>Radius ladder</p>
        <div className="flex flex-wrap gap-6">
          {radiusSteps.map((step) => (
            <div
              key={step.value}
              className="flex w-[140px] shrink-0 flex-col gap-2.5"
            >
              <div
                className={cn(
                  "h-[140px] w-[140px] shrink-0 bg-ob-card",
                  step.className,
                )}
              />
              <div className="flex flex-col gap-0.5">
                <p className={cn(obDataLabel, "text-ob-ink")}>{step.value}</p>
                <p className={cn(obCaption, "text-ob-ink-secondary")}>
                  {step.use}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <p className={cn(obDataLabel, "text-ob-ink-secondary")}>Elevation</p>
        <div className="flex flex-wrap gap-6">
          {elevationSteps.map((step) => (
            <div
              key={step.name}
              className="flex w-[240px] shrink-0 flex-col gap-2.5"
            >
              <div
                className={cn(
                  "h-[140px] w-[240px] shrink-0 rounded-3xl bg-ob-card",
                  step.className,
                )}
              />
              <div className="flex flex-col gap-0.5">
                <p className={cn(obDataLabel, "text-ob-ink")}>{step.name}</p>
                <p className={cn(obCaption, "text-ob-ink-secondary")}>
                  {step.use}
                </p>
                <p className={cn(obCaption, "mt-1 text-ob-ink-secondary")}>
                  {step.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <p className={cn(obDataLabel, "text-ob-ink-secondary")}>Spacing rhythm</p>
        <div className="flex flex-wrap items-end gap-12">
          <div className="flex shrink-0 items-end gap-7">
            {spacingSteps.map((step) => (
              <div
                key={step}
                className="flex shrink-0 flex-col items-center gap-2.5"
              >
                <div
                  className="w-9 rounded-b-[2px] bg-ob-ink"
                  style={{ height: step }}
                />
                <p className={cn(obDataLabel, "text-ob-ink-secondary")}>{step}</p>
              </div>
            ))}
          </div>
          <div className="flex max-w-[560px] flex-col gap-1.5">
            <p className={cn(obDataLabel, "text-ob-ink")}>
              4px base · deliberate variance, not uniform gaps
            </p>
            <p className={cn(obCaption, "text-ob-ink-secondary")}>
              H1 to body 8 · body to first block 24 · option cards 12 apart ·
              options to CTA 32 · CTA to text link 8 · screen top 24 · page
              gutter 20 · card padding 20 (option) or 24 (hero) · kit grid 16.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
