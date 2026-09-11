import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { obFocusRing } from "./classes";

type IconButtonProps = {
  label: string;
  icon: ReactNode;
  tone?: "light" | "dark";
  dot?: boolean;
  onClick?: () => void;
  className?: string;
};

export function IconButton({
  label,
  icon,
  tone = "light",
  dot = false,
  onClick,
  className,
}: IconButtonProps) {
  const isDark = tone === "dark";
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-full transition-[background-color,transform] duration-150 motion-reduce:transition-none enabled:active:scale-[0.98]",
        isDark
          ? "size-12 bg-ob-ink text-white enabled:hover:bg-[#2a2a30]"
          : "ob-shadow-rest size-11 bg-ob-card text-ob-ink enabled:hover:bg-ob-soft",
        obFocusRing,
        className,
      )}
    >
      {icon}
      {dot ? (
        <span
          aria-hidden="true"
          className="absolute top-1.5 right-1.5 size-2 rounded-full bg-ob-red-notice"
        />
      ) : null}
    </button>
  );
}
