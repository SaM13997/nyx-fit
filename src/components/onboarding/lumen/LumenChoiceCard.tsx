import { useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExperienceLevel } from "../config";

type LumenChoiceCardProps = {
  name: string;
  value: ExperienceLevel;
  label: string;
  detail: string;
  checked: boolean;
  onSelect: (value: ExperienceLevel) => void;
};

export function LumenChoiceCard({
  name,
  value,
  label,
  detail,
  checked,
  onSelect,
}: LumenChoiceCardProps) {
  const cardRef = useRef<HTMLLabelElement>(null);
  const reduceMotion = useReducedMotion();

  const handlePointerMove = (event: ReactPointerEvent<HTMLLabelElement>) => {
    if (event.pointerType === "touch") return;
    const node = cardRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    node.style.setProperty("--lm-mx", `${event.clientX - rect.left}px`);
    node.style.setProperty("--lm-my", `${event.clientY - rect.top}px`);
  };

  return (
    <label
      ref={cardRef}
      onPointerMove={handlePointerMove}
      className={cn(
        "group relative flex min-h-[104px] w-full cursor-pointer items-center gap-4 overflow-hidden rounded-[24px] px-6 py-5 transition-[border-color] duration-200 motion-reduce:transition-none active:scale-[0.99] motion-reduce:active:scale-100 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-lm-ink",
        checked ? "border-2 border-lm-ink" : "border border-lm-line bg-white",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,#e9f7cd_0%,#f6fce9_58%,#fdfef9_100%)] transition-opacity duration-200 motion-reduce:transition-none",
          checked ? "opacity-100" : "opacity-0",
        )}
      />
      {!checked ? (
        <span
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(220px circle at var(--lm-mx, 50%) var(--lm-my, 50%), rgba(200,246,92,0.22), transparent 72%)",
          }}
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 motion-reduce:transition-none"
        />
      ) : null}
      <span className="relative min-w-0 flex-1">
        <span className="block font-heading text-[18px] leading-[22px] font-bold tracking-[-0.01em] text-lm-ink">
          {label}
        </span>
        <span className="mt-1 block text-[15px] leading-[1.4] text-lm-ink-soft">
          {detail}
        </span>
      </span>
      <span className="relative flex size-8 shrink-0 items-center justify-center">
        {checked ? (
          <motion.span
            initial={reduceMotion ? false : { scale: 0.7 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
            className="flex size-8 items-center justify-center rounded-full bg-lm-lime text-lm-ink"
          >
            <Check className="size-[18px]" strokeWidth={3} />
          </motion.span>
        ) : (
          <span
            aria-hidden="true"
            className="block size-7 rounded-full border-[1.5px] border-[#9a99a1]"
          />
        )}
      </span>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onSelect(value)}
        className="sr-only"
      />
    </label>
  );
}
