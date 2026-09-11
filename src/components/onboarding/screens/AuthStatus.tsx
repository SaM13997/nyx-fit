import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { copy } from "../config";
import { InlineAlert } from "../kit/InlineAlert";
import { PrimaryButton } from "../kit/PrimaryButton";
import { TextLink } from "../kit/TextLink";
import { obBody, obScreenTitle } from "../kit/classes";

export function AuthSaving() {
  return (
    <div>
      <h1
        tabIndex={-1}
        className={cn(obScreenTitle, "text-ob-ink focus:outline-none")}
      >
        {copy.auth.setup.heading}
      </h1>
      <div
        role="status"
        className={cn(
          obBody,
          "mt-6 flex items-center gap-3 text-ob-ink-secondary",
        )}
      >
        <Loader2
          aria-hidden="true"
          className="size-5 animate-spin"
          strokeWidth={1.5}
        />
        <span>Saving your profile…</span>
      </div>
    </div>
  );
}

export function AuthError({
  message,
  onRetry,
  onAbandon,
}: {
  message: string;
  onRetry: () => void;
  onAbandon: () => void;
}) {
  return (
    <div>
      <h1
        tabIndex={-1}
        className={cn(obScreenTitle, "text-ob-ink focus:outline-none")}
      >
        {copy.auth.setup.heading}
      </h1>
      <InlineAlert className="mt-6">{message}</InlineAlert>
      <PrimaryButton onClick={onRetry} className="mt-6">
        Retry saving
      </PrimaryButton>
      <TextLink onClick={onAbandon} className="mx-auto mt-2 flex">
        Continue without saving
      </TextLink>
    </div>
  );
}
