import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { ExperienceLevel } from "../../config";
import { GoogleColorMark } from "../GoogleColorMark";
import { LumenShell } from "../LumenShell";
import { ProfileCardArt } from "../artwork";
import { lmBody, lmScreenTitle } from "../classes";
import { lumenCopy } from "../config";

function LumenLegalRow({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "text-center text-[12px] leading-4 font-medium break-words text-lm-ink-soft",
        className,
      )}
    >
      By continuing, you agree to our{" "}
      <Button asChild variant="link" size="xs" className="min-h-11 px-1">
        <Link to="/terms">Terms</Link>
      </Button>{" "}
      and{" "}
      <Button asChild variant="link" size="xs" className="min-h-11 px-1">
        <Link to="/privacy">Privacy Policy</Link>
      </Button>
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
          <Button
            type="button"
            variant="outline"
            size="icon-xl"
            aria-label="Go back"
            onClick={onBack}
          >
            <ChevronLeft aria-hidden="true" className="size-6" strokeWidth={2} />
          </Button>
          <div className="flex-1">
            <Button
              type="button"
              variant="card"
              size="xl"
              onClick={onContinue}
              disabled={saving}
              aria-busy={saving ? true : undefined}
              className="w-full"
            >
              {saving ? (
                <>
                  <Spinner className="size-5" />
                  Saving your profile...
                </>
              ) : (
                <>
                  <GoogleColorMark />
                  {lumenCopy.save.action}
                </>
              )}
            </Button>
          </div>
        </div>
        <LumenLegalRow className="mt-2" />
      </div>
    </LumenShell>
  );
}
