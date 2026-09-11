import { cn } from "@/lib/utils";

export function LumenStepper({
  step,
  className,
}: {
  step: 2 | 3 | 4;
  className?: string;
}) {
  const segment = step - 1;

  return (
    <div
      role="progressbar"
      aria-label={`Step ${segment} of 3`}
      aria-valuemin={1}
      aria-valuemax={3}
      aria-valuenow={segment}
      className={cn("flex gap-1.5", className)}
    >
      {[1, 2, 3].map((value) => (
        <span
          key={value}
          className={cn(
            "h-1.5 flex-1 rounded-full transition-colors duration-200 motion-reduce:transition-none",
            value <= segment ? "bg-lm-ink" : "bg-lm-ink/10",
          )}
        />
      ))}
    </div>
  );
}
