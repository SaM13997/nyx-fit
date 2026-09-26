import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import type { ExperienceLevel } from "../config";
import { experienceOptions } from "../flow/config";
import { LevelPicker } from "../flow/LevelPicker";
import { ActionBar, BackButton, Heading, PrimaryButton, Rise, Text } from "../ui";

export function ExperienceStep({
  value,
  onSelect,
  onBack,
  onNext,
}: {
  value: ExperienceLevel;
  onSelect: (value: ExperienceLevel) => void;
  onBack: () => void;
  onNext: (value: ExperienceLevel) => void;
}) {
  const detail = experienceOptions.find((option) => option.value === value)?.detail;
  return (
    <>
      <Rise className="-mx-6 -mt-1">
        <LevelPicker value={value} onChange={onSelect} />
      </Rise>
      <Rise className="mt-5">
        <Heading>Where are you starting from?</Heading>
      </Rise>
      <Rise className="relative mt-2 h-6">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={value}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Text>{detail}</Text>
          </motion.div>
        </AnimatePresence>
      </Rise>
      <ActionBar>
        <BackButton onClick={onBack} />
        <PrimaryButton onClick={() => onNext(value)}>
          Next
          <ChevronRight aria-hidden="true" className="-mr-1 size-5" strokeWidth={2.25} />
        </PrimaryButton>
      </ActionBar>
    </>
  );
}
