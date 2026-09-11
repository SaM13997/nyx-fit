import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { obDataLabel, obFocusRing } from "./classes";

export type PillChipVariant = "neutral" | "soft" | "lime" | "dark" | "inverse";

const variantClasses: Record<PillChipVariant, string> = {
  neutral: "bg-ob-soft text-ob-ink-secondary",
  soft: "bg-ob-green-tint text-ob-green",
  lime: "border-[1.5px] border-ob-ink bg-ob-lime text-ob-ink",
  dark: "bg-ob-ink text-white",
  inverse: "bg-ob-card text-ob-green",
};

type PillChipProps = {
  children: ReactNode;
  variant?: PillChipVariant;
  size?: "default" | "compact";
  icon?: ReactNode;
  dot?: boolean;
  onClick?: () => void;
  className?: string;
};

export function PillChip({
  children,
  variant = "neutral",
  size = "default",
  icon,
  dot = false,
  onClick,
  className,
}: PillChipProps) {
  const interactiveClass =
    onClick === undefined
      ? undefined
      : cn(
          "transition-transform duration-150 motion-reduce:transition-none enabled:active:scale-[0.98]",
          variant === "neutral" && "enabled:hover:bg-[#e8e7ec]",
        );

  const content = (
    <>
      {dot ? (
        <span
          aria-hidden="true"
          className="size-2 shrink-0 rounded-full bg-current"
        />
      ) : null}
      {icon}
      {children}
    </>
  );

  const classes = cn(
    "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3",
    size === "compact" ? "h-7" : "h-8",
    variantClasses[variant],
    interactiveClass,
    obDataLabel,
    obFocusRing,
    className,
  );

  if (onClick !== undefined) {
    return (
      <button type="button" onClick={onClick} className={classes}>
        {content}
      </button>
    );
  }

  return <span className={classes}>{content}</span>;
}
