import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { obFocusRing, obLinkLabel } from "./classes";

const textLinkClass =
  "inline-flex min-h-11 items-center justify-center rounded-lg px-2 text-ob-ink-secondary underline decoration-ob-ink-secondary/30 underline-offset-4 transition-colors duration-150 hover:text-ob-ink motion-reduce:transition-none";

export function TextLink({
  children,
  onClick,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(textLinkClass, obLinkLabel, obFocusRing, className)}
    >
      {children}
    </button>
  );
}
