import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function VStack({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-4", className)} {...props} />;
}

export function HStack({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex items-center gap-3", className)} {...props} />;
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-flow-line bg-flow-card p-3 flow-shadow-card",
        className,
      )}
      {...props}
    />
  );
}

export function Heading({ className, ...props }: ComponentProps<"h1">) {
  return (
    <h1
      tabIndex={-1}
      className={cn(
        "text-[28px] leading-[1.15] font-bold tracking-[-0.02em] text-flow-ink focus:outline-none",
        className,
      )}
      {...props}
    />
  );
}

export function Text({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      className={cn("text-[16px] leading-[1.5] text-flow-ink-soft", className)}
      {...props}
    />
  );
}

export function Image({ className, ...props }: ComponentProps<"img">) {
  return (
    <img
      className={cn("block w-full rounded-[20px] object-cover", className)}
      {...props}
    />
  );
}

export function TextButton({
  type = "button",
  className,
  ...props
}: ComponentProps<"button">) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1 rounded-full px-4 text-sm font-semibold text-flow-ink-soft transition-colors hover:text-flow-ink motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flow-ink",
        className,
      )}
      {...props}
    />
  );
}

export function PrimaryButton({
  type = "button",
  className,
  ...props
}: ComponentProps<"button">) {
  return (
    <button
      type={type}
      className={cn(
        "flex min-h-14 w-full flex-1 items-center justify-center gap-2 rounded-full bg-flow-ink px-5 text-base font-bold text-white flow-shadow-action",
        "transition-[background-color,transform] duration-150 motion-reduce:transition-none",
        "enabled:hover:bg-flow-teal enabled:active:scale-[0.98] motion-reduce:enabled:active:scale-100",
        "disabled:cursor-not-allowed disabled:opacity-40",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
        className,
      )}
      {...props}
    />
  );
}

export function StepIndicator({
  step,
  total,
  className,
}: {
  step: number;
  total: number;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-1.5 px-1 pt-1", className)}>
      <span className="sr-only">{`Step ${step} of ${total}`}</span>
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          aria-hidden="true"
          className={cn(
            "h-1.5 flex-1 rounded-full",
            index < step ? "bg-flow-ink" : "bg-flow-bar-rest",
          )}
        />
      ))}
    </div>
  );
}
