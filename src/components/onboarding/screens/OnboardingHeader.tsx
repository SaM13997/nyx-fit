import { StepRail } from "../kit/StepRail";

type OnboardingHeaderProps = {
  stepNumber: number;
  totalSteps: number;
  showRail: boolean;
};

export function OnboardingHeader({
  stepNumber,
  totalSteps,
  showRail,
}: OnboardingHeaderProps) {
  return (
    <header className="w-full">
      <p className="font-heading text-center text-2xl leading-8 font-semibold text-ob-ink">
        Nyx Fit
      </p>
      {showRail ? (
        <StepRail total={totalSteps} current={stepNumber} className="mt-6" />
      ) : null}
    </header>
  );
}
