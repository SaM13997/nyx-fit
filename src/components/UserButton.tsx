import { useNavigate, Link } from "@tanstack/react-router";
import { LogOut, Settings, User } from "lucide-react";
import { motion } from "framer-motion";

import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
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

function getInitial(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return trimmed[0]?.toUpperCase() ?? "?";
}

export function UserButton({ name, email, image, className }: UserButtonProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
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
            className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 transition-transform active:scale-95"
          >
            <Avatar className="size-10 border border-white/10">
              {image ? <AvatarImage src={image} alt={name} /> : null}
              <AvatarFallback className="bg-white/10 text-white">
                <span className="text-sm font-semibold">
                  {getInitial(name)}
                </span>
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={8}
          className="w-72 overflow-hidden rounded-2xl border border-white/10 bg-black/80 p-0 shadow-xl backdrop-blur-xl"
          asChild
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
          >
            <div className="flex items-center gap-3 px-4 py-4">
              <Avatar className="size-12 border border-white/10">
                {image ? <AvatarImage src={image} alt={name} /> : null}
                <AvatarFallback className="bg-white/10 text-white">
                  <span className="text-base font-semibold">
                    {getInitial(name)}
                  </span>
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="truncate font-semibold text-white">{name}</div>
                {email ? (
                  <div className="truncate text-sm text-zinc-400">{email}</div>
                ) : null}
              </div>
            </div>

            <DropdownMenuSeparator className="bg-white/10" />

            <div className="p-2">
              <DropdownMenuItem asChild>
                <Link
                  to="/settings/profile"
                  viewTransition
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-200 hover:bg-white/10 focus:bg-white/10 outline-none"
                >
                  <User size={16} className="text-zinc-400" />
                  Account
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  to="/settings"
                  viewTransition
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-200 hover:bg-white/10 focus:bg-white/10 outline-none"
                >
                  <Settings size={16} className="text-zinc-400" />
                  Settings
                </Link>
              </DropdownMenuItem>
            </div>

            <DropdownMenuSeparator className="bg-white/10" />

            <div className="p-2">
              <DropdownMenuItem
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-300 hover:bg-red-500/10 focus:bg-red-500/10 outline-none cursor-pointer"
              >
                <LogOut size={16} className="text-red-300" />
                Log out
              </DropdownMenuItem>
            </div>
          </motion.div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
