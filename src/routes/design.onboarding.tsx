import { createFileRoute } from "@tanstack/react-router";
import { BoardSection } from "@/components/onboarding/board/BoardSection";
import type { ExperienceLevel } from "@/components/onboarding/config";
import { OnboardingConceptBoard } from "@/components/onboarding/lumen/OnboardingConceptBoard";
import { lumenSteps, type LumenStep } from "@/components/onboarding/lumen/config";

type OnboardingSearch = {
  present: boolean;
  step: LumenStep;
  size: "phone" | "compact";
  level: ExperienceLevel | null;
};

function parsePresent(value: unknown): boolean {
  return value === "1" || value === 1 || value === "true" || value === true;
}

function parseStep(value: unknown): LumenStep {
  for (const step of lumenSteps) {
    if (step === value) return step;
  }
  return "welcome";
}

function parseSize(value: unknown): "phone" | "compact" {
  return value === "compact" ? "compact" : "phone";
}

function parseLevel(value: unknown): ExperienceLevel | null {
  if (value === "beginner" || value === "intermediary" || value === "advanced") {
    return value;
  }
  return null;
}

export const Route = createFileRoute("/design/onboarding")({
  validateSearch: (search: Record<string, unknown>): OnboardingSearch => ({
    present: parsePresent(search.present),
    step: parseStep(search.step),
    size: parseSize(search.size),
    level: parseLevel(search.level),
  }),
  component: DesignOnboardingPage,
});

function DesignOnboardingPage() {
  const { present, step, size, level } = Route.useSearch();

  if (present) {
    return (
      <div className="theme-lumen bg-lm-bg">
        <OnboardingConceptBoard
          presentation
          initialStep={step}
          initialSize={size}
          initialLevel={level}
        />
      </div>
    );
  }

  return (
    <div className="theme-lumen min-h-full bg-lm-bg">
      <BoardSection
        title="Onboarding — warm light concept"
        description="Four steps, one live prototype. Warm off-white surfaces, lavender and mint ribbons, ink actions, lime selection. Switch screens, resize the stage, and walk the flow end to end."
      >
        <OnboardingConceptBoard />
      </BoardSection>
    </div>
  );
}
