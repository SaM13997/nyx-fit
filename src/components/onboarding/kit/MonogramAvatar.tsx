import { cn } from "@/lib/utils";

const fills = [
  "bg-ob-soft",
  "bg-[var(--ob-wash-lavender)]",
  "bg-[var(--ob-wash-mint)]",
  "bg-[var(--ob-wash-peach)]",
  "bg-ob-track",
];

function hashName(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function initialsOf(name: string | undefined): string {
  if (name === undefined) return "NF";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.charAt(0) ?? "";
  const second = parts.length > 1 ? (parts[1]?.charAt(0) ?? "") : "";
  return `${first}${second}`.toUpperCase() || "NF";
}

export function MonogramAvatar({
  name,
  size = 44,
  className,
}: {
  name?: string;
  size?: 40 | 44;
  className?: string;
}) {
  const fill = fills[hashName(name ?? "") % fills.length];
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 select-none items-center justify-center rounded-full text-[15px] leading-5 font-bold text-ob-ink",
        size === 40 ? "size-10" : "size-11",
        fill,
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  );
}
