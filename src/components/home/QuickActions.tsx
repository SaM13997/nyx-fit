import { Link } from "@tanstack/react-router";
import { TrendingUp, Weight } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Link
        to="/stats"
        className={cn(
          "relative overflow-hidden rounded-[2rem] p-6 border border-white/10 shadow-2xl backdrop-blur-md bg-black/80",
          "flex flex-col items-center text-center cursor-pointer",
          "transition-all duration-300 hover:border-white/20 hover:shadow-blue-500/10"
        )}
      >
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-zinc-900 to-black" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-full h-14 w-14 flex items-center justify-center mb-3">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 blur-md rounded-full" />
              <TrendingUp className="h-6 w-6 text-blue-400 relative z-10" />
            </div>
          </div>
          <span className="font-bold text-white mb-1">Stats</span>
          <span className="text-gray-400 text-sm font-medium">View progress</span>
        </div>
      </Link>

      <Link
        to="/weights"
        className={cn(
          "relative overflow-hidden rounded-[2rem] p-6 border border-white/10 shadow-2xl backdrop-blur-md bg-black/80",
          "flex flex-col items-center text-center cursor-pointer",
          "transition-all duration-300 hover:border-white/20 hover:shadow-orange-500/10"
        )}
      >
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-900/40 via-zinc-900 to-black" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-full h-14 w-14 flex items-center justify-center mb-3">
            <div className="relative">
              <div className="absolute inset-0 bg-orange-500/20 blur-md rounded-full" />
              <Weight className="h-6 w-6 text-orange-400 relative z-10" />
            </div>
          </div>
          <span className="font-bold text-white mb-1">Weight</span>
          <span className="text-gray-400 text-sm font-medium">Track weight</span>
        </div>
      </Link>
    </div>
  );
}

