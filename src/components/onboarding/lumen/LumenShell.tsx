import type { ReactNode } from "react";
import { Progress } from "@/components/ui/progress";
import { LumenBackground, type LumenWash } from "./LumenBackground";

function StepProgress({ step }: { step: 2 | 3 | 4 }) {
  const segment = step - 1;

  return (
    <div className="mt-4 flex gap-1.5">
      <span className="sr-only">Step {segment} of 3</span>
      {[1, 2, 3].map((value) => (
        <Progress
          key={value}
          aria-hidden="true"
          value={value <= segment ? 100 : 0}
          className="h-1.5 flex-1"
        />
      ))}
    </div>
  );
}

function FlowHeader({ step }: { step: 2 | 3 | 4 }) {
  return (
    <header>
      <div className="flex h-11 items-center justify-center">
        <p className="font-heading text-[17px] leading-6 font-semibold tracking-[-0.01em] text-lm-ink">
          Nyx Fit
        </p>
      </div>
      <StepProgress step={step} />
    </header>
  );
}

export function LumenShell({
  step,
  wash,
  children,
}: {
  step: 1 | 2 | 3 | 4;
  wash: LumenWash;
  children: ReactNode;
}) {
  return (
    <div className="relative isolate flex h-full w-full flex-col overflow-hidden bg-lm-bg text-lm-ink">
      <LumenBackground wash={wash} />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-lm-bg/20 backdrop-blur-[2px]"
      />
      <div className="relative flex min-h-0 flex-1 flex-col px-6 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {step === 1 ? null : <FlowHeader step={step} />}
        <div className="scrollbar-hide mt-5 flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="flex min-h-full w-full flex-col">{children}</div>
        </div>
      </div>
    </div>
  );
}
