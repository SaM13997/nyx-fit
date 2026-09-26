import { ChevronRight } from "lucide-react";
import { ActionBar, Heading, PrimaryButton, Rise, Text, TextButton } from "../ui";

export function WelcomeStep({
  onStart,
  onExisting,
}: {
  onStart: () => void;
  onExisting: () => void;
}) {
  return (
    <>
      <Rise>
        <Heading>Train with intent.</Heading>
      </Rise>
      <Rise>
        <Text className="mx-auto mt-3 max-w-[30ch]">
          Log sets in seconds, watch your progress stack up, and build a rhythm
          that lasts.
        </Text>
      </Rise>
      <ActionBar>
        <TextButton onClick={onExisting}>I have an account</TextButton>
        <PrimaryButton onClick={onStart}>
          Get started
          <ChevronRight aria-hidden="true" className="-mr-1 size-5" strokeWidth={2.25} />
        </PrimaryButton>
      </ActionBar>
    </>
  );
}
