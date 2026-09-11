import { useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LoginForm } from "@/components/login-form";
import { copy, type ExperienceLevel } from "../config";
import { WashBackground, type OnboardingWash } from "../kit/WashBackground";
import { AuthError, AuthSaving } from "../screens/AuthStatus";
import { DoneScreen } from "../screens/DoneScreen";
import { ExperienceScreen } from "../screens/ExperienceScreen";
import { OnboardingHeader } from "../screens/OnboardingHeader";
import { WelcomeScreen } from "../screens/WelcomeScreen";

const noop = () => {};

type ScreenHeader = {
  stepNumber: number;
  showRail: boolean;
};

export function ScreensBoard() {
  const [experience, setExperience] = useState<ExperienceLevel | null>(
    "intermediary",
  );

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap gap-10">
        <ScreenFrame wash="welcome">
          <WelcomeScreen onStart={noop} onExistingAccount={noop} />
        </ScreenFrame>
        <ScreenFrame
          wash="experience"
          header={{ stepNumber: 2, showRail: true }}
        >
          <ExperienceScreen
            value={experience}
            onChange={setExperience}
            onContinue={noop}
          />
        </ScreenFrame>
        <ScreenFrame wash="auth" header={{ stepNumber: 3, showRail: true }}>
          <LoginForm
            heading={copy.auth.setup.heading}
            description={copy.auth.setup.description}
            variant="onboarding"
          />
        </ScreenFrame>
        <ScreenFrame wash="done" header={{ stepNumber: 4, showRail: true }}>
          <DoneScreen action={copy.done.action} onContinue={noop} />
        </ScreenFrame>
      </div>

      <div className="mt-12 flex flex-wrap gap-10 border-t border-ob-hairline pt-12">
        <ScreenFrame
          wash="experience"
          header={{ stepNumber: 2, showRail: true }}
        >
          <ExperienceScreen value={null} onChange={noop} onContinue={noop} />
        </ScreenFrame>
        <ScreenFrame wash="auth" header={{ stepNumber: 3, showRail: false }}>
          <LoginForm
            heading={copy.auth.existing.heading}
            description={copy.auth.existing.description}
            variant="onboarding"
          />
        </ScreenFrame>
        <ScreenFrame wash="auth" header={{ stepNumber: 3, showRail: true }}>
          <AuthSaving />
        </ScreenFrame>
        <ScreenFrame wash="auth" header={{ stepNumber: 3, showRail: true }}>
          <AuthError
            message="We couldn't save your training experience. Check your connection and try again."
            onRetry={noop}
            onAbandon={noop}
          />
        </ScreenFrame>
      </div>
    </div>
  );
}

function ScreenFrame({
  wash,
  header,
  children,
}: {
  wash: OnboardingWash;
  header?: ScreenHeader;
  children: ReactNode;
}) {
  return (
    <div className="relative isolate h-[844px] w-[390px] shrink-0 overflow-hidden rounded-[44px] border border-ob-hairline bg-ob-canvas shadow-xl">
      <WashBackground wash={wash} />
      <div className="relative flex h-full flex-col overflow-y-auto px-5 pt-5 pb-6">
        {header ? (
          <OnboardingHeader
            stepNumber={header.stepNumber}
            totalSteps={4}
            showRail={header.showRail}
          />
        ) : null}
        <div className={cn("flex flex-1 flex-col", header && "mt-6")}>
          {children}
        </div>
      </div>
    </div>
  );
}
