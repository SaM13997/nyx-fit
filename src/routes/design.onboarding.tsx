import { createFileRoute } from "@tanstack/react-router";
import { BoardSection } from "@/components/onboarding/board/BoardSection";
import type { ExperienceLevel } from "@/components/onboarding/config";
import { OnboardingConceptBoard } from "@/components/onboarding/flow/OnboardingConceptBoard";
import { steps, type FlowStep } from "@/components/onboarding/flow/config";

type OnboardingSearch = {
  present: boolean;
  step: FlowStep;
  size: "phone" | "compact";
  level: ExperienceLevel | null;
};

function parsePresent(value: unknown): boolean {
  return value === "1" || value === 1 || value === "true" || value === true;
}

function parseStep(value: unknown): FlowStep {
  for (const step of steps) {
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
      <div className="theme-flow bg-flow-bg">
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
    <div className="theme-flow min-h-full bg-flow-bg">
      <BoardSection
        title="Onboarding — pastel replay concept"
        description="Four steps, one live prototype. Pale cyan field with blush and mint illustrated panels, minimalist line-art faces with a training cue, charcoal action dock, white pill CTAs, mint/cyan/ink choices. Switch screens, resize the stage, and walk the flow end to end."
      >
        <OnboardingConceptBoard />
      </BoardSection>
    </div>
  );
}
