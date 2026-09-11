import { cn } from "@/lib/utils";
import { obDataLabel } from "./classes";

type StatusTone = "positive" | "neutral" | "attention";

const toneClasses: Record<StatusTone, { chip: string; dot: string }> = {
  positive: { chip: "bg-ob-green-tint text-ob-green", dot: "bg-ob-green" },
  neutral: { chip: "bg-ob-soft text-ob-ink-secondary", dot: "bg-ob-ink-secondary" },
  attention: { chip: "bg-ob-alert-bg text-ob-alert-text", dot: "bg-ob-red-notice" },
};

export function StatusChip({
  tone = "positive",
  children,
}: {
  tone?: StatusTone;
  children: React.ReactNode;
}) {
  const { chip, dot } = toneClasses[tone];
  return (
    <span
      className={cn(
        "inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3",
        chip,
        obDataLabel,
      )}
    >
      <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", dot)} />
      {children}
    </span>
  );
}
