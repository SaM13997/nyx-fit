import { useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LoginForm } from "@/components/login-form";
import { copy, type ExperienceLevel } from "../config";
import { WashBackground, type OnboardingWash } from "../kit/WashBackground";
import { obCaption, obDataLabel } from "../kit/classes";
import { AuthError, AuthSaving } from "../screens/AuthStatus";
import { DoneScreen } from "../screens/DoneScreen";
import { ExperienceScreen } from "../screens/ExperienceScreen";
import { OnboardingHeader } from "../screens/OnboardingHeader";
import { WelcomeScreen } from "../screens/WelcomeScreen";

const noop = () => {};

type ScreenHeader = {
  stepNumber: number;
  showRail: boolean;
  showBack: boolean;
};

export function ScreensBoard() {
  const [experience, setExperience] = useState<ExperienceLevel | null>(
    "intermediary",
  );

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap gap-10">
        <ScreenFrame label="Welcome" meta="no header · no rail" wash="welcome">
          <WelcomeScreen onStart={noop} onExistingAccount={noop} />
        </ScreenFrame>
        <ScreenFrame
          label="Experience"
          meta="intermediate selected"
          wash="experience"
          header={{ stepNumber: 2, showRail: true, showBack: true }}
        >
          <ExperienceScreen
            value={experience}
            onChange={setExperience}
            onContinue={noop}
          />
        </ScreenFrame>
        <ScreenFrame
          label="Auth"
          meta="save profile"
          wash="auth"
          header={{ stepNumber: 3, showRail: true, showBack: true }}
        >
          <LoginForm
            heading={copy.auth.setup.heading}
            description={copy.auth.setup.description}
            variant="onboarding"
          />
        </ScreenFrame>
        <ScreenFrame
          label="Done"
          wash="done"
          header={{ stepNumber: 4, showRail: true, showBack: false }}
        >
          <DoneScreen action={copy.done.action} onContinue={noop} />
        </ScreenFrame>
      </div>

      <div className="mt-12 flex flex-wrap gap-10 border-t border-ob-hairline pt-12">
        <ScreenFrame
          label="Experience — no selection"
          meta="Continue stays disabled"
          wash="experience"
          header={{ stepNumber: 2, showRail: true, showBack: true }}
        >
          <ExperienceScreen value={null} onChange={noop} onContinue={noop} />
        </ScreenFrame>
        <ScreenFrame
          label="Auth — existing account"
          meta="rail and step counter hidden"
          wash="auth"
          header={{ stepNumber: 3, showRail: false, showBack: true }}
        >
          <LoginForm
            heading={copy.auth.existing.heading}
            description={copy.auth.existing.description}
            variant="onboarding"
          />
        </ScreenFrame>
        <ScreenFrame
          label="Auth — saving"
          meta="save status after OAuth return"
          wash="auth"
          header={{ stepNumber: 3, showRail: true, showBack: false }}
        >
          <AuthSaving />
        </ScreenFrame>
        <ScreenFrame
          label="Auth — save error"
          meta="alert plus recovery pair"
          wash="auth"
          header={{ stepNumber: 3, showRail: true, showBack: false }}
        >
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
  label,
  meta,
  wash,
  header,
  children,
}: {
  label: string;
  meta?: string;
  wash: OnboardingWash;
  header?: ScreenHeader;
  children: ReactNode;
}) {
  return (
    <figure className="flex w-[390px] shrink-0 flex-col gap-3">
      <figcaption className="flex flex-col gap-0.5">
        <p className={cn(obDataLabel, "text-ob-ink")}>{label}</p>
        {meta ? (
          <p className={cn(obCaption, "text-ob-ink-secondary")}>{meta}</p>
        ) : null}
      </figcaption>
      <div className="relative isolate h-[844px] w-[390px] overflow-hidden rounded-[44px] border border-ob-hairline bg-ob-canvas shadow-xl">
        <WashBackground wash={wash} />
        <div className="relative flex h-full flex-col overflow-y-auto px-5 pt-5 pb-6">
          {header ? (
            <OnboardingHeader
              stepNumber={header.stepNumber}
              totalSteps={4}
              showRail={header.showRail}
              showBack={header.showBack}
              onBack={noop}
            />
          ) : null}
          <div className={cn("flex flex-1 flex-col", header && "mt-6")}>
            {children}
          </div>
        </div>
      </div>
    </figure>
  );
}
