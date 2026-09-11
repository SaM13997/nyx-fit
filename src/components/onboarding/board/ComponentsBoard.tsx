import { ArrowRight, Bell, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { BrandMark } from "../kit/BrandMark";
import { CheckBadge } from "../kit/CheckBadge";
import { DarkDataCard } from "../kit/DarkDataCard";
import { GoogleButton } from "../kit/GoogleButton";
import { IconButton } from "../kit/IconButton";
import { InlineAlert } from "../kit/InlineAlert";
import { LegalRow } from "../kit/LegalRow";
import { MiniBarChart } from "../kit/MiniBarChart";
import { MonogramAvatar } from "../kit/MonogramAvatar";
import { OptionCard } from "../kit/OptionCard";
import { PillChip } from "../kit/PillChip";
import { PrimaryButton } from "../kit/PrimaryButton";
import { ProgressRing } from "../kit/ProgressRing";
import { StatusChip } from "../kit/StatusChip";
import { StepRail } from "../kit/StepRail";
import { TextLink } from "../kit/TextLink";
import { ThinProgressBar } from "../kit/ThinProgressBar";
import { obCaption, obDataLabel, obNumberXl } from "../kit/classes";

const noop = () => {};

export function ComponentsBoard() {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      <Panel title="Buttons">
        <div className="flex flex-col gap-4">
          <PrimaryButton
            icon={
              <ArrowRight
                aria-hidden="true"
                className="size-5"
                strokeWidth={1.5}
              />
            }
          >
            Set up my profile
          </PrimaryButton>
          <PrimaryButton disabled>Continue</PrimaryButton>
          <PrimaryButton loading loadingLabel="Saving your profile...">
            Continue
          </PrimaryButton>
          <GoogleButton />
          <div className="flex justify-center">
            <TextLink onClick={noop}>I already have an account</TextLink>
          </div>
        </div>
      </Panel>

      <Panel title="Pills & chips">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <PillChip>Neutral</PillChip>
            <PillChip variant="soft">On track</PillChip>
            <PillChip variant="lime">Selected</PillChip>
            <PillChip variant="dark">Focus</PillChip>
            <PillChip size="compact">Compact</PillChip>
            <PillChip onClick={noop}>Filter</PillChip>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip tone="positive">Online</StatusChip>
            <StatusChip tone="neutral">Paused</StatusChip>
            <StatusChip tone="attention">Needs review</StatusChip>
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-ob-ink p-3">
            <PillChip variant="inverse">On track</PillChip>
            <PillChip variant="dark">Focus</PillChip>
          </div>
        </div>
      </Panel>

      <Panel title="Option cards">
        <div className="flex flex-col gap-3 rounded-2xl bg-ob-canvas p-4">
          <OptionCard
            name="kit-option"
            value="beginner"
            label="Beginner"
            detail="I'm learning the basics or building a foundation."
            index={0}
            checked={false}
            onSelect={noop}
          />
          <OptionCard
            name="kit-option"
            value="intermediary"
            label="Intermediate"
            detail="I'm comfortable with the basics and have trained consistently."
            index={1}
            checked
            onSelect={noop}
          />
          <OptionCard
            name="kit-option"
            value="advanced"
            label="Advanced"
            detail="I have extensive training experience and manage my own programming."
            index={2}
            checked={false}
            onSelect={noop}
          />
        </div>
      </Panel>

      <Panel title="Progress">
        <div className="flex flex-col gap-6">
          <div>
            <p className="mb-2 text-xs text-ob-ink-secondary">
              Step rail — 2 of 4
            </p>
            <StepRail total={4} current={2} />
          </div>
          <div>
            <p className="mb-2 text-xs text-ob-ink-secondary">
              Thin progress — 65%
            </p>
            <ThinProgressBar value={65} />
          </div>
          <div className="flex justify-center">
            <ProgressRing value={65} size={148}>
              <span className={cn(obNumberXl, "text-ob-ink")}>65</span>
              <span className={cn(obDataLabel, "text-ob-ink-secondary")}>
                hours
              </span>
              <span className={cn(obCaption, "text-ob-ink-secondary")}>
                This week
              </span>
            </ProgressRing>
          </div>
        </div>
      </Panel>

      <Panel title="Data art" className="md:col-span-2">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="rounded-[28px] bg-ob-canvas p-4">
            <MiniBarChart />
          </div>
          <div className="flex items-center rounded-[28px] bg-ob-canvas p-4">
            <DarkDataCard className="max-w-[320px]" />
          </div>
        </div>
      </Panel>

      <Panel title="Identity & iconography">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <IconButton
              label="Notifications"
              icon={<Bell className="size-5" strokeWidth={1.5} />}
            />
            <IconButton
              label="Notifications, unread"
              icon={<Bell className="size-5" strokeWidth={1.5} />}
              dot
            />
            <IconButton
              label="Add"
              tone="dark"
              icon={<Plus className="size-5" strokeWidth={1.5} />}
            />
          </div>
          <div className="flex items-center gap-3">
            <MonogramAvatar name="Ada Lovelace" />
            <MonogramAvatar name="Ada Lovelace" size={40} />
            <MonogramAvatar />
            <BrandMark />
          </div>
          <div className="flex items-center gap-4">
            <CheckBadge />
            <CheckBadge size={64} />
          </div>
        </div>
      </Panel>

      <Panel title="Feedback">
        <div className="flex flex-col gap-4">
          <InlineAlert>
            We couldn't save your training experience. Check your connection and
            try again.
          </InlineAlert>
          <PrimaryButton>Retry saving</PrimaryButton>
          <div className="flex justify-center">
            <TextLink onClick={noop}>Continue without saving</TextLink>
          </div>
          <div className="border-t border-ob-hairline pt-4">
            <LegalRow />
          </div>
        </div>
      </Panel>
    </div>
  );
}

function Panel({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "ob-shadow-rest rounded-3xl bg-ob-card p-5",
        className,
      )}
    >
      <p className={cn(obDataLabel, "mb-4 text-ob-ink-secondary")}>{title}</p>
      {children}
    </div>
  );
}
