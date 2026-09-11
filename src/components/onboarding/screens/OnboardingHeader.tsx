import { ArrowLeft, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandMark } from "../kit/BrandMark";
import { StepRail } from "../kit/StepRail";
import { obFocusRing, obMicro } from "../kit/classes";

type OnboardingHeaderProps = {
  stepNumber: number;
  totalSteps: number;
  showRail: boolean;
  showBack: boolean;
  onBack: () => void;
};

export function OnboardingHeader({
  stepNumber,
  totalSteps,
  showRail,
  showBack,
  onBack,
}: OnboardingHeaderProps) {
  return (
    <header className="w-full">
      <div className="flex min-h-11 items-center gap-3">
        <BrandMark />
        <span className="flex min-w-0 flex-1 flex-col justify-center">
          <span className="text-[13px] leading-[18px] tracking-[0.01em] text-ob-ink-secondary">
            Built around you
          </span>
          <span className="text-base leading-5 font-semibold text-ob-ink">
            Nyx Fit
          </span>
        </span>
        <span
          aria-hidden="true"
          className="ob-shadow-rest relative flex size-11 shrink-0 items-center justify-center rounded-full bg-ob-card text-ob-ink"
        >
          <Bell className="size-5" strokeWidth={1.5} />
          <span className="absolute top-2 right-2 size-2 rounded-full bg-ob-red-notice" />
        </span>
      </div>
      {showRail ? (
        <StepRail total={totalSteps} current={stepNumber} className="mt-6" />
      ) : null}
      <div className="mt-3 flex min-h-11 items-center justify-between">
        {showBack ? (
          <button
            type="button"
            onClick={onBack}
            className={cn(
              "-ml-2 flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-ob-ink-secondary transition-colors duration-150 hover:text-ob-ink motion-reduce:transition-none",
              obFocusRing,
            )}
          >
            <ArrowLeft aria-hidden="true" className="size-5" strokeWidth={1.5} />
            Back
          </button>
        ) : (
          <span />
        )}
        {showRail ? (
          <span className={cn(obMicro, "tabular-nums text-ob-ink-secondary")}>
            Step {stepNumber} of {totalSteps}
          </span>
        ) : (
          <span />
        )}
      </div>
    </header>
  );
}
