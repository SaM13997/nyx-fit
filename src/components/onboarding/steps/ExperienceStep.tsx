import { Check, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { experienceOptions, type ExperienceLevel } from "../config";
import {
  Card,
  Heading,
  HStack,
  Image,
  PrimaryButton,
  StepIndicator,
  Text,
  TextButton,
  VStack,
} from "../ui";

const panelByLevel: Record<ExperienceLevel, string> = {
  beginner: "bg-flow-mint",
  intermediary: "bg-flow-cyan/20",
  advanced: "bg-flow-blush",
};

export function ExperienceStep({
  value,
  onSelect,
  onBack,
  onNext,
}: {
  value: ExperienceLevel | null;
  onSelect: (value: ExperienceLevel) => void;
  onBack: () => void;
  onNext: (value: ExperienceLevel) => void;
}) {
  return (
    <VStack className="min-h-svh px-6 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <Card>
        <StepIndicator step={2} total={4} />
        <Image src="/onboarding/2.png" alt="" className="mt-2" />
      </Card>
      <Heading className="mt-2">Find your starting point.</Heading>
      <Text>Choose your training experience. You can change this anytime.</Text>
      <div className="mt-1 flex flex-col gap-2.5">
        {experienceOptions.map((option) => {
          const checked = value === option.value;
          return (
            <label
              key={option.value}
              className={cn(
                "flex min-h-16 w-full cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition-[border-color] duration-150 motion-reduce:transition-none",
                "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-flow-ink",
                panelByLevel[option.value],
                checked ? "border-flow-ink/70" : "border-transparent",
              )}
            >
              <input
                type="radio"
                name="experience"
                value={option.value}
                checked={checked}
                onChange={() => onSelect(option.value)}
                className="sr-only"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-[17px] font-semibold leading-[22px] text-flow-ink">
                  {option.label}
                </span>
                <span className="block text-sm leading-5 text-flow-ink-soft">
                  {option.detail}
                </span>
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full",
                  checked
                    ? "bg-flow-ink text-white"
                    : "border-[1.5px] border-flow-ink/30",
                )}
              >
                {checked ? (
                  <Check aria-hidden="true" className="size-4" strokeWidth={3} />
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
      <HStack className="mt-auto pt-4">
        <TextButton onClick={onBack}>
          <ChevronLeft aria-hidden="true" className="size-5" strokeWidth={2} />
          Back
        </TextButton>
        <PrimaryButton
          onClick={() => value !== null && onNext(value)}
          disabled={value === null}
        >
          Next
        </PrimaryButton>
      </HStack>
    </VStack>
  );
}
