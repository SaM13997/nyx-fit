import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { obDetail, obMicro, obRowTitle } from "./classes";
import { CheckBadge } from "./CheckBadge";

type OptionCardProps = {
  name: string;
  value: string;
  label: string;
  detail: string;
  index: number;
  checked: boolean;
  onSelect: () => void;
};

export function OptionCard({
  name,
  value,
  label,
  detail,
  index,
  checked,
  onSelect,
}: OptionCardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <label
      className={cn(
        "flex min-h-[76px] w-full cursor-pointer items-center gap-4 rounded-[20px] border-[1.5px] bg-ob-card p-5 transition-shadow duration-[160ms] motion-reduce:transition-none active:scale-[0.99] motion-reduce:active:scale-100 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ob-action",
        checked
          ? "border-ob-ink ob-shadow-float"
          : "border-transparent ob-shadow-rest",
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onSelect}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className={cn(obMicro, "text-ob-ink-secondary tabular-nums")}
      >
        {String(index + 1).padStart(2, "0")}
      </span>
      <span className="flex-1">
        <span className={cn("block text-ob-ink", obRowTitle)}>{label}</span>
        <span className={cn("mt-0.5 block text-ob-ink-secondary", obDetail)}>
          {detail}
        </span>
      </span>
      {checked ? (
        <motion.span
          initial={reduceMotion ? false : { scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 22 }}
          className="flex shrink-0"
        >
          <CheckBadge />
        </motion.span>
      ) : (
        <span
          aria-hidden="true"
          className="size-6 shrink-0 rounded-full border-2 border-ob-control"
        />
      )}
    </label>
  );
}
