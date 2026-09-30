import { useNavigate, Link } from "@tanstack/react-router";
import { LogOut, Settings, User } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

import { authClient } from "@/lib/auth-client";
import { cn, getInitialCharacter } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type UserButtonProps = {
  name: string;
  email?: string;
  image?: string;
  className?: string;
};

export function UserButton({ name, email, image, className }: UserButtonProps) {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await authClient.signOut();
    } finally {
      navigate({ to: "/login" });
    }
  };

  return (
    <div className={cn("relative", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Open account menu"
            className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/60 transition-transform active:scale-95"
          >
            <Avatar className="size-10 border border-border">
              {image ? <AvatarImage src={image} alt={name} /> : null}
              <AvatarFallback className="bg-fill-strong text-foreground">
                <span className="text-sm font-semibold">
                  {getInitialCharacter(name)}
                </span>
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={8}
          className="w-72 overflow-hidden rounded-2xl border border-border bg-glass p-0 shadow-[var(--elev-float),var(--highlight)] backdrop-blur-xl"
          asChild
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
          >
            <div className="flex items-center gap-3 px-4 py-4">
              <Avatar className="size-12 border border-border">
                {image ? <AvatarImage src={image} alt={name} /> : null}
                <AvatarFallback className="bg-fill-strong text-foreground">
                  <span className="text-base font-semibold">
                    {getInitialCharacter(name)}
                  </span>
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="truncate font-semibold text-foreground">{name || "Athlete"}</div>
                {email ? (
                  <div className="truncate text-sm text-muted-foreground">{email}</div>
                ) : null}
              </div>
            </div>

            <DropdownMenuSeparator className="bg-border" />

            <div className="p-2">
              <DropdownMenuItem asChild>
                <Link
                  to="/settings/profile"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-secondary hover:bg-fill-strong focus:bg-fill-strong outline-none"
                >
                  <User size={16} className="text-muted-foreground" />
                  Account
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  to="/settings"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-secondary hover:bg-fill-strong focus:bg-fill-strong outline-none"
                >
                  <Settings size={16} className="text-muted-foreground" />
                  Settings
                </Link>
              </DropdownMenuItem>
            </div>

            <DropdownMenuSeparator className="bg-border" />

            <div className="p-2">
              <DropdownMenuItem
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger-ink hover:bg-danger-ink/10 focus:bg-danger-ink/10 outline-none cursor-pointer"
              >
                <LogOut size={16} className="text-danger-ink" />
                {isLoggingOut ? "Logging out..." : "Log out"}
              </DropdownMenuItem>
            </div>
          </motion.div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
