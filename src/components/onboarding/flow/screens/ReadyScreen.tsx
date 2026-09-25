import { ArrowRight, Bell, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { ExperienceLevel } from "../../config";
import { ScreenShell } from "../ScreenShell";
import { CheerArt, LevelBarsIcon } from "../artwork";
import { ctaPill, screenTitle } from "../classes";
import { flowCopy, levelLabel } from "../config";

export function ReadyScreen({
  level,
  action = flowCopy.ready.action,
  disabled = false,
  remindersEnabled,
  remindersPending,
  reminderError,
  onToggleReminders,
  onOpenDashboard,
}: {
  level: ExperienceLevel | null;
  action?: string;
  disabled?: boolean;
  remindersEnabled: boolean;
  remindersPending: boolean;
  reminderError: string | null;
  onToggleReminders: () => void;
  onOpenDashboard: () => void;
}) {
  return (
    <ScreenShell
      step={4}
      footer={
        <Button
          type="button"
          variant="card"
          size="xl"
          onClick={onOpenDashboard}
          disabled={disabled}
          className={cn(
            ctaPill,
            "w-full enabled:active:scale-[0.98] motion-reduce:enabled:active:scale-100",
          )}
        >
          {action}
          <ArrowRight
            aria-hidden="true"
            className="size-5"
            strokeWidth={1.75}
          />
        </Button>
      }
    >
      <div className="flex min-h-full flex-col items-center text-center">
        <div className="flex flex-1 items-center justify-center py-2">
          <CheerArt />
        </div>

        <h1
          tabIndex={-1}
          className={cn(screenTitle, "mt-2 text-flow-ink focus:outline-none")}
        >
          {flowCopy.ready.heading}
        </h1>

        <div className="flow-shadow-card mt-5 flex w-full items-center gap-3.5 rounded-[22px] border border-flow-line bg-white p-4 text-left">
          <span aria-hidden="true" className="shrink-0 text-flow-teal">
            <LevelBarsIcon count={3} tone="cyan" className="size-7" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[12px] leading-4 text-flow-ink-faint">
              {flowCopy.save.cardLabel}
            </span>
            <span className="block text-[15px] leading-5 font-bold text-flow-ink">
              {levelLabel(level)}
            </span>
          </span>
          <span
            aria-hidden="true"
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-flow-cyan text-flow-ink"
          >
            <Check className="size-4" strokeWidth={3} />
          </span>
        </div>

        <div className="flow-shadow-card mt-2.5 flex w-full items-center gap-3.5 rounded-[22px] border border-flow-line bg-white p-4 text-left">
          <span aria-hidden="true" className="shrink-0 text-flow-teal">
            <Bell className="size-7" strokeWidth={1.5} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] leading-5 font-bold text-flow-ink">
              {flowCopy.ready.remindersTitle}
            </span>
            <span className="block text-[12px] leading-4 text-flow-ink-faint">
              {flowCopy.ready.remindersDescription}
            </span>
            {reminderError !== null ? (
              <span
                role="alert"
                className="mt-1 block text-[12px] leading-4 text-red-600"
              >
                {reminderError}
              </span>
            ) : null}
          </span>
          <label className="-mx-1.5 -my-3 flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center">
            <Switch
              aria-label="Reminders"
              checked={remindersEnabled}
              disabled={remindersPending}
              onCheckedChange={onToggleReminders}
            />
          </label>
        </div>
      </div>
    </ScreenShell>
  );
}
