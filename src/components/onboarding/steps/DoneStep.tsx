import { ActionBar, Heading, PrimaryButton, Rise, Text } from "../ui";

export function DoneStep({
  buttonLabel,
  onContinue,
}: {
  buttonLabel: string;
  onContinue: () => void;
}) {
  return (
    <>
      <Rise>
        <Heading>You’re ready to begin.</Heading>
      </Rise>
      <Rise>
        <Text className="mx-auto mt-3 max-w-[30ch]">
          Your profile is saved. You can change your training experience any
          time in settings.
        </Text>
      </Rise>
      <ActionBar>
        <PrimaryButton onClick={onContinue}>{buttonLabel}</PrimaryButton>
      </ActionBar>
    </>
  );
}
