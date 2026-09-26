import { ArrowRight } from "lucide-react";
import {
  Card,
  Heading,
  Image,
  PrimaryButton,
  StepIndicator,
  Text,
  TextButton,
  VStack,
} from "../ui";

export function WelcomeStep({
  onStart,
  onExisting,
}: {
  onStart: () => void;
  onExisting: () => void;
}) {
  return (
    <VStack className="min-h-svh px-6 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <Card>
        <StepIndicator step={1} total={4} />
        <Image src="/onboarding/1.png" alt="" className="mt-2" />
      </Card>
      <Heading className="mt-2">Train with intent.</Heading>
      <Text>Log your workouts. See your progress. Build a rhythm that lasts.</Text>
      <VStack className="mt-auto gap-1">
        <PrimaryButton onClick={onStart}>
          Set up my profile
          <ArrowRight aria-hidden="true" className="size-5" strokeWidth={1.75} />
        </PrimaryButton>
        <TextButton onClick={onExisting} className="self-center">
          I already have an account
        </TextButton>
      </VStack>
    </VStack>
  );
}
