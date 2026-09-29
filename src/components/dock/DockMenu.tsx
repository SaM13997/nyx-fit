import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useEffect, useEffectEvent, useId, useRef } from "react";

import { navItems, type NavHref } from "@/config/navigation";
import { fade, pressScale, springs } from "@/lib/motion";
import { cn } from "@/lib/utils";

type DockMenuProps = {
  open: boolean;
  activeHref: NavHref;
  onOpenChange: (open: boolean) => void;
};

// Round pill that opens a nav menu upward from the dock.
export function DockMenu({ open, activeHref, onOpenChange }: DockMenuProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  const close = useEffectEvent((returnFocus: boolean) => {
    onOpenChange(false);
    if (returnFocus) pillRef.current?.focus({ preventScroll: true });
  });

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close(true);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) {
        close(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="pointer-events-auto relative shrink-0">
      <motion.button
        ref={pillRef}
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        whileTap={pressScale}
        transition={springs.snappy}
        onClick={() => onOpenChange(!open)}
        className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-zinc-900/70 text-white shadow-[0_12px_40px_rgb(0_0_0/0.5),inset_0_1px_0_rgb(255_255_255/0.08)] outline-none backdrop-blur-2xl backdrop-saturate-150 focus-visible:ring-2 focus-visible:ring-white/60"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? "close" : "open"}
            initial={{ opacity: 0, rotate: -45, scale: 0.7 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 45, scale: 0.7 }}
            transition={{ duration: 0.12 }}
            className="flex"
          >
            {open ? <X aria-hidden className="h-6 w-6" /> : <Menu aria-hidden className="h-6 w-6" />}
          </motion.span>
        </AnimatePresence>
      </motion.button>
      {/* After the pill in DOM order so Tab moves from the pill into the menu. */}
      <AnimatePresence>
        {open ? (
          <motion.ul
            id={menuId}
            aria-label="Navigation"
            initial={{ opacity: 0, y: 12, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96, transition: fade }}
            transition={springs.sheet}
            style={{ transformOrigin: "bottom left" }}
            className="absolute bottom-[calc(100%+0.75rem)] left-0 w-56 rounded-3xl border border-white/10 bg-zinc-900/85 p-1.5 shadow-[0_12px_40px_rgb(0_0_0/0.5),inset_0_1px_0_rgb(255_255_255/0.08)] backdrop-blur-2xl backdrop-saturate-150"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.href === activeHref;
              return (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => close(true)}
                    className={cn(
                      "flex min-h-12 items-center gap-3 rounded-2xl px-3.5 text-[15px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white/60",
                      active ? "bg-white/10 text-white" : "text-zinc-300 hover:bg-white/5"
                    )}
                  >
                    <Icon
                      aria-hidden
                      className="h-5 w-5"
                      style={{ color: active ? item.iconColor : undefined }}
                    />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
