import { cn } from "@/lib/utils";

export function StepRail({
  total,
  current,
  className,
}: {
  total: number;
  current: number;
  className?: string;
}) {
  return (
    <div
      role="progressbar"
      aria-label="Onboarding progress"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current}
      className={cn("flex gap-1.5", className)}
    >
      {Array.from({ length: total }, (_, index) => (
        <div
          key={index}
          className={cn(
            "h-1 flex-1 rounded-full",
            index < current ? "bg-ob-ink" : "bg-ob-ink/10",
          )}
        />
      ))}
    </div>
  );
}
