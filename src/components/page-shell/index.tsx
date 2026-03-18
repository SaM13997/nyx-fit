import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type AccentColor = "purple" | "orange" | "cyan" | "emerald" | "rose";

interface PageShellProps {
  children: ReactNode;
  className?: string;
}

export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className={cn("bg-black text-white font-sans min-h-screen pb-20", className)}>
      {children}
    </div>
  );
}

interface PageHeroProps {
  title: string;
  description?: string;
  accentColor?: AccentColor;
  height?: "small" | "medium" | "large";
}

const accentConfig: Record<AccentColor, { hexClass: string; icon: string }> = {
  purple: { hexClass: "#a855f7", icon: "" },
  orange: { hexClass: "#f97316", icon: "" },
  cyan: { hexClass: "#06b6d4", icon: "" },
  emerald: { hexClass: "#10b981", icon: "" },
  rose: { hexClass: "#f43f5e", icon: "" },
};

export function PageHero({
  title,
  description,
  accentColor = "purple",
  height = "medium",
}: PageHeroProps) {
  const heights = {
    small: "25vh",
    medium: "30vh",
    large: "35vh",
  };

  const textColors: Record<AccentColor, string> = {
    purple: "text-purple-500",
    orange: "text-orange-500",
    cyan: "text-cyan-500",
    emerald: "text-emerald-500",
    rose: "text-rose-500",
  };

  return (
    <div
      className="relative pointer-events-none overflow-hidden"
      style={{ height: heights[height] }}
    >
      <div
        className="absolute inset-0 animated-hex-bg opacity-50"
        style={{ "--c": accentConfig[accentColor].hexClass } as React.CSSProperties}
      />
      <div className="absolute inset-0 backdrop-blur-sm" />
      <div className="absolute inset-0 bg-gradient-to-tr from-black via-black/60 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black h-10 to-transparent" />

      <div className="relative flex flex-col justify-end h-full px-4 pt-12">
        <div className="max-w-md mx-auto w-full">
          <h1 className={cn("text-5xl font-bold tracking-tighter", textColors[accentColor])}>
            {title}
          </h1>
          {description && (
            <p className="text-sm text-zinc-400 mt-2">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

interface ContentContainerProps {
  children: ReactNode;
  className?: string;
}

export function ContentContainer({ children, className }: ContentContainerProps) {
  return (
    <div className={cn("relative px-4", className)}>
      <div className="mx-auto max-w-md space-y-6">
        {children}
      </div>
    </div>
  );
}

interface SectionBlockProps {
  children: ReactNode;
  title?: ReactNode;
  className?: string;
}

export function SectionBlock({ children, title, className }: SectionBlockProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {title && (
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          {children}
        </h2>
      )}
      {!title && children}
    </div>
  );
}

interface StateBlockProps {
  variant: "loading" | "empty" | "error";
  title?: string;
  message?: string;
  icon?: ReactNode;
  className?: string;
}

export function StateBlock({
  variant,
  title,
  message,
  icon,
  className,
}: StateBlockProps) {
  const variants = {
    loading: {
      container: "py-20 text-center",
      iconColor: "text-purple-500",
      titleColor: "text-zinc-300",
      messageColor: "text-zinc-500",
    },
    empty: {
      container: "p-6 rounded-3xl bg-zinc-900/30 border border-zinc-800/50 text-center",
      iconColor: "text-zinc-600",
      titleColor: "text-zinc-400",
      messageColor: "text-zinc-500",
    },
    error: {
      container: "p-6 rounded-3xl bg-red-900/10 border border-red-500/20 text-center",
      iconColor: "text-red-500",
      titleColor: "text-red-400",
      messageColor: "text-red-400/70",
    },
  };

  const config = variants[variant];

  return (
    <div className={cn(config.container, className)}>
      {icon && <div className={cn("mb-4", config.iconColor)}>{icon}</div>}
      {title && (
        <h3 className={cn("text-lg font-bold", config.titleColor)}>{title}</h3>
      )}
      {message && (
        <p className={cn("text-sm mt-1", config.messageColor)}>{message}</p>
      )}
    </div>
  );
}
