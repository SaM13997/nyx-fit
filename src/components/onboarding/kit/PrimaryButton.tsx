import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { obButtonLabel, obFocusRing } from "./classes";

type PrimaryButtonProps = React.ComponentProps<"button"> & {
  children: ReactNode;
  icon?: ReactNode;
  loading?: boolean;
  loadingLabel?: string;
};

export function PrimaryButton({
  children,
  icon,
  loading = false,
  loadingLabel = "Loading…",
  className,
  disabled,
  type = "button",
  ...props
}: PrimaryButtonProps) {
  const isDisabled = disabled === true;
  const showDisabledSkin = isDisabled && !loading;

  return (
    <button
      type={type}
      disabled={isDisabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl px-5 transition-[background-color,transform] duration-[120ms] motion-reduce:transition-none",
        showDisabledSkin
          ? "cursor-not-allowed bg-ob-disabled text-ob-control"
          : cn(
              "ob-shadow-action bg-ob-action text-white enabled:hover:bg-ob-action-hover enabled:active:scale-[0.98] enabled:active:bg-ob-action-active",
              loading && "cursor-wait",
            ),
        obButtonLabel,
        obFocusRing,
        className,
      )}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
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
