import { Card, Heading, Image, PrimaryButton, StepIndicator, Text, VStack } from "../ui";

export function DoneStep({
  buttonLabel = "Get fit",
  onContinue,
}: {
  buttonLabel?: string;
  onContinue: () => void;
}) {
  return (
    <VStack className="min-h-svh px-6 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <Card>
        <StepIndicator step={4} total={4} />
        <Image src="/onboarding/4.png" alt="" className="mt-2" />
      </Card>
      <Heading className="mt-2">You’re ready to begin.</Heading>
      <Text>
        Your profile is saved. You can update your training experience in
        profile settings.
      </Text>
      <PrimaryButton onClick={onContinue} className="mt-auto">
        {buttonLabel}
      </PrimaryButton>
    </VStack>
  );
}
