import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function CheckBadge({
  size = 24,
  className,
}: {
  size?: 24 | 64;
  className?: string;
}) {
  const isLarge = size === 64;
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-ob-lime text-ob-ink",
        isLarge ? "size-16" : "size-6",
        className,
      )}
    >
      <Check
        className={isLarge ? "size-7" : "size-3.5"}
        strokeWidth={2.5}
      />
    </span>
  );
}
