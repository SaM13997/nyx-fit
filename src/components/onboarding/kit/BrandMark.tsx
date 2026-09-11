import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--ob-wash-lavender)] text-[15px] leading-5 font-bold text-ob-ink",
        className,
      )}
    >
      NF
    </span>
  );
}
