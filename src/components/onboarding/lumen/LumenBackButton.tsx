import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { lmFocusRing } from "./classes";

export function LumenBackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Go back"
      className={cn(
        "flex size-14 shrink-0 items-center justify-center rounded-[16px] border border-lm-line bg-white text-lm-ink transition-[background-color,transform] duration-150 hover:bg-lm-bg active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100",
        lmFocusRing,
      )}
    >
      <ChevronLeft className="size-6" strokeWidth={2} />
    </button>
  );
}
