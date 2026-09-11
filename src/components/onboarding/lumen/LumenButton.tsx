import { Loader2 } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { lmButtonLabel, lmFocusRing } from "./classes";

type LumenButtonProps = ComponentProps<"button"> & {
  children: ReactNode;
  icon?: ReactNode;
  loading?: boolean;
  loadingLabel?: string;
  variant?: "ink" | "card";
};

export function LumenButton({
  children,
  icon,
  loading = false,
  loadingLabel = "Loading\u2026",
  variant = "ink",
  className,
  disabled,
  type = "button",
  ...props
}: LumenButtonProps) {
  const isDisabled = disabled === true;
  const showDisabledSkin = isDisabled && !loading;

  return (
    <button
      type={type}
      disabled={isDisabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "flex min-h-14 w-full items-center justify-center gap-2.5 rounded-[16px] px-5 transition-[background-color,border-color,transform,box-shadow] duration-150 motion-reduce:transition-none",
        showDisabledSkin
          ? "cursor-not-allowed bg-lm-disabled text-lm-disabled-ink"
          : variant === "card"
            ? cn(
                "lm-shadow-card border border-lm-line bg-white text-lm-ink enabled:hover:bg-lm-bg enabled:active:scale-[0.98]",
                loading && "cursor-wait",
              )
            : cn(
                "lm-shadow-action bg-lm-ink text-white enabled:hover:bg-[#2a2a2e] enabled:active:scale-[0.98] enabled:active:bg-[#0d0d0f]",
                loading && "cursor-wait",
              ),
        lmButtonLabel,
        lmFocusRing,
        className,
      )}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2.5">
          <Loader2 aria-hidden="true" className="size-5 animate-spin" />
          {loadingLabel}
        </span>
      ) : (
        <>
          {children}
          {icon}
        </>
      )}
    </button>
  );
}
