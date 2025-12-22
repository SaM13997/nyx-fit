import { useEffect, useId, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Settings, User } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export type UserButtonProps = {
  name: string;
  email?: string;
  image?: string;
  className?: string;
};

function getInitial(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return trimmed[0]?.toUpperCase() ?? "?";
}

export function UserButton({ name, email, image, className }: UserButtonProps) {
  const navigate = useNavigate();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (rootRef.current && target && !rootRef.current.contains(target)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const handleLogout = async () => {
    try {
      await authClient.signOut();
    } finally {
      setOpen(false);
      navigate({ to: "/login" });
    }
  };

  const menuItemBase =
    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-200 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20";

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
      >
        <Avatar className="size-10">
          {image ? <AvatarImage src={image} alt={name} /> : null}
          <AvatarFallback className="bg-white/10 text-white">
            <span className="text-sm font-semibold">{getInitial(name)}</span>
          </AvatarFallback>
        </Avatar>
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="User menu"
          className="absolute right-0 mt-2 w-72 overflow-hidden rounded-2xl border border-white/10 bg-black/80 shadow-xl backdrop-blur-xl z-50"
        >
          <div className="flex items-center gap-3 px-4 py-4">
            <Avatar className="size-12">
              {image ? <AvatarImage src={image} alt={name} /> : null}
              <AvatarFallback className="bg-white/10 text-white">
                <span className="text-base font-semibold">{getInitial(name)}</span>
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="truncate font-semibold text-white">{name}</div>
              {email ? (
                <div className="truncate text-sm text-zinc-400">{email}</div>
              ) : null}
            </div>
          </div>

          <div className="h-px bg-white/10" />

          <div className="p-2">
            <Link
              to="/settings/profile"
              viewTransition
              role="menuitem"
              className={menuItemBase}
              onClick={() => setOpen(false)}
            >
              <User size={16} className="text-zinc-400" />
              Account
            </Link>
            <Link
              to="/settings"
              viewTransition
              role="menuitem"
              className={menuItemBase}
              onClick={() => setOpen(false)}
            >
              <Settings size={16} className="text-zinc-400" />
              Settings
            </Link>
          </div>

          <div className="h-px bg-white/10" />

          <div className="p-2">
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className={cn(menuItemBase, "text-red-300 hover:bg-red-500/10")}
            >
              <LogOut size={16} className="text-red-300" />
              Log out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
