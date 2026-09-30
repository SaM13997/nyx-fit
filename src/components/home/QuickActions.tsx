import { Link } from "@tanstack/react-router";
import { TrendingUp, Weight } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Link
        to="/stats"
        className={cn(
          "relative overflow-hidden rounded-[2rem] p-6 border border-border shadow-float backdrop-blur-md bg-glass",
          "flex flex-col items-center text-center cursor-pointer",
          "transition-[transform,border-color,box-shadow] duration-200 ease-out active:scale-[0.96] hover:border-line-strong hover:shadow-blue-500/10"
        )}
      >
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-700/10 dark:from-blue-900/40 via-card to-background" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="bg-blue-500/10 border border-blue-600/30 dark:border-blue-500/20 rounded-full h-14 w-14 flex items-center justify-center mb-3">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 blur-md rounded-full" />
              <TrendingUp className="h-6 w-6 text-blue-700 dark:text-blue-400 relative z-10" />
            </div>
          </div>
          <span className="font-bold text-foreground mb-1">Stats</span>
          <span className="text-muted-foreground text-sm font-medium">View progress</span>
        </div>
      </Link>

      <Link
        to="/weights"
        className={cn(
          "relative overflow-hidden rounded-[2rem] p-6 border border-border shadow-float backdrop-blur-md bg-glass",
          "flex flex-col items-center text-center cursor-pointer",
          "transition-[transform,border-color,box-shadow] duration-200 ease-out active:scale-[0.96] hover:border-line-strong hover:shadow-orange-500/10"
        )}
      >
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-700/10 dark:from-orange-900/40 via-card to-background" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="bg-orange-500/10 border border-orange-600/30 dark:border-orange-500/20 rounded-full h-14 w-14 flex items-center justify-center mb-3">
            <div className="relative">
              <div className="absolute inset-0 bg-orange-500/20 blur-md rounded-full" />
              <Weight className="h-6 w-6 text-orange-700 dark:text-orange-400 relative z-10" />
            </div>
          </div>
          <span className="font-bold text-foreground mb-1">Weight</span>
          <span className="text-muted-foreground text-sm font-medium">Track weight</span>
        </div>
      </Link>
    </div>
  );
}

