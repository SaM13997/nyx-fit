import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import type { ExperienceLevel } from "../../config";
import { GoogleColorMark } from "../GoogleColorMark";
import { LumenBackButton } from "../LumenBackButton";
import { LumenButton } from "../LumenButton";
import { LumenShell } from "../LumenShell";
import { ProfileCardArt } from "../artwork";
import { lmBody, lmFocusRing, lmScreenTitle } from "../classes";
import { lumenCopy } from "../config";

const legalLinkClass = cn(
  "inline-flex min-h-11 items-center font-semibold text-lm-ink underline decoration-lm-ink/40 underline-offset-4 transition-colors hover:decoration-lm-ink motion-reduce:transition-none",
  lmFocusRing,
);

function LumenLegalRow({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "text-center text-[12px] leading-4 font-medium break-words text-lm-ink-soft",
        className,
      )}
    >
      By continuing, you agree to our{" "}
      <Link to="/terms" className={legalLinkClass}>
        Terms
      </Link>{" "}
      and{" "}
      <Link to="/privacy" className={legalLinkClass}>
        Privacy Policy
      </Link>
      .
    </p>
  );
}

export function LumenSaveProfileScreen({
  level,
  saving,
  onBack,
  onContinue,
}: {
  level: ExperienceLevel | null;
  saving: boolean;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <LumenShell step={3} wash="save">
      <h1 className={cn(lmScreenTitle, "text-lm-ink")}>
        {lumenCopy.save.heading}
      </h1>

      <div className="relative mt-3 flex min-h-[316px] flex-1 items-center justify-center py-6">
        <ProfileCardArt level={level} />
      </div>

      <p className={cn(lmBody, "mt-3 max-w-[330px]")}>
        {lumenCopy.save.description}
      </p>

      <div className="mt-6 shrink-0">
        <div className="flex items-center gap-3">
          <LumenBackButton onClick={onBack} />
          <div className="flex-1">
            <LumenButton
              onClick={onContinue}
              loading={saving}
              loadingLabel="Saving your profile..."
              variant="card"
            >
              <GoogleColorMark />
              {lumenCopy.save.action}
            </LumenButton>
          </div>
        </div>
        <LumenLegalRow className="mt-2" />
      </div>
    </LumenShell>
  );
}
