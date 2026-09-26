import { useEffect, useRef, type ComponentProps } from "react";
import { motion, type HTMLMotionProps, type Variants } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-night-ink";

const rise: Variants = {
  initial: { opacity: 0, y: 18, filter: "blur(6px)" },
  enter: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 420, damping: 34 },
  },
};

/** Staggers in with its siblings when the step body enters. */
export function Rise({ className, ...props }: HTMLMotionProps<"div">) {
  return <motion.div variants={rise} className={className} {...props} />;
}

/** Step heading; takes focus when the step mounts so screen readers hear it. */
export function Heading({ className, ...props }: ComponentProps<"h1">) {
  const ref = useRef<HTMLHeadingElement | null>(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);
  return (
    <h1
      ref={ref}
      tabIndex={-1}
      className={cn(
        "text-balance text-center text-[30px] leading-[1.1] font-semibold tracking-[-0.01em] text-night-ink focus:outline-none",
        className,
      )}
      {...props}
    />
  );
}

export function Text({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "text-pretty text-center text-[16px] leading-[1.45] text-night-ink-soft",
        className,
      )}
      {...props}
    />
  );
}

/** Bottom thumb zone: back/secondary on the left, primary on the right. */
export function ActionBar({ className, ...props }: HTMLMotionProps<"div">) {
  return (
    <Rise
      className={cn("mt-auto flex items-center gap-3 pt-5", className)}
      {...props}
    />
  );
}

export function PrimaryButton({
  type = "button",
  className,
  ...props
}: HTMLMotionProps<"button">) {
  return (
    <motion.button
      type={type}
      whileTap={props.disabled ? undefined : { scale: 0.96 }}
      transition={{ type: "spring", stiffness: 600, damping: 30 }}
      className={cn(
        "flex min-h-14 flex-1 items-center justify-center gap-2 rounded-full bg-night-ink px-6 text-[16px] font-semibold text-night-bg",
        "transition-colors duration-150 enabled:hover:bg-white motion-reduce:transition-none",
        "disabled:cursor-not-allowed disabled:opacity-60",
        focusRing,
        className,
      )}
      {...props}
    />
  );
}

export function BackButton({
  className,
  ...props
}: Omit<HTMLMotionProps<"button">, "children">) {
  return (
    <motion.button
      type="button"
      aria-label="Back"
      whileTap={{ scale: 0.9 }}
      transition={{ type: "spring", stiffness: 600, damping: 30 }}
      className={cn(
        "flex size-14 shrink-0 items-center justify-center rounded-full bg-night-surface text-night-ink transition-colors duration-150 hover:bg-[#2a2b32] motion-reduce:transition-none",
        focusRing,
        className,
      )}
      {...props}
    >
      <ChevronLeft aria-hidden="true" className="size-6" strokeWidth={2} />
    </motion.button>
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
        "inline-flex min-h-14 min-w-11 shrink-0 items-center justify-center rounded-full px-5 text-[15px] font-semibold text-night-ink-soft transition-colors duration-150 hover:text-night-ink motion-reduce:transition-none",
        focusRing,
        className,
      )}
      {...props}
    />
  );
}
