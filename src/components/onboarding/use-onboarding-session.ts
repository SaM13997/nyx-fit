import { useEffect, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import { useUpsertCurrentProfile } from "@/lib/api/hooks";
import {
  clearOnboardingDraft,
  readOnboardingDraft,
  type ExperienceLevel,
  type OnboardingDraft,
} from "./config";

export type SaveState =
  | { status: "saving" }
  | { status: "error"; message: string };

const SAVE_FALLBACK_ERROR =
  "We couldn't save your training experience. Check your connection and try again.";

/**
 * Restores an interrupted draft once, then when the session appears either
 * completes the profile save or exits to the redirect destination.
 */
export function useOnboardingSession(
  destination: string,
  onResume: (draft: OnboardingDraft | null) => void,
  onDone: () => void,
) {
  const router = useRouter();
  const { data, isPending } = authClient.useSession();
  const session = data?.session;
  const { upsertCurrentProfile } = useUpsertCurrentProfile();
  const [ready, setReady] = useState(false);
  const [handoff, setHandoff] = useState(false);
  const [saveState, setSaveState] = useState<SaveState | null>(null);

  useEffect(() => {
    onResume(readOnboardingDraft());
    setReady(true);
  }, []);

  const saveProfile = (value: ExperienceLevel) => {
    setSaveState({ status: "saving" });
    void upsertCurrentProfile({ updates: { fitnessLevel: value } })
      .then(() => {
        clearOnboardingDraft();
        onDone();
      })
      .catch((error: unknown) =>
        setSaveState({
          status: "error",
          message:
            error instanceof Error && error.message.trim()
              ? error.message
              : SAVE_FALLBACK_ERROR,
        }),
      );
  };

  const finish = () => {
    clearOnboardingDraft();
    router.history.replace(destination);
  };

  useEffect(() => {
    if (!ready || isPending || !session || handoff) return;
    setHandoff(true);
    const draft = readOnboardingDraft();
    if (draft !== null && draft.step === "auth" && draft.fitnessLevel !== null) {
      saveProfile(draft.fitnessLevel);
      return;
    }
    finish();
  }, [ready, isPending, session, handoff, destination]);

  return {
    waiting: !ready || (isPending && !session) || (!!session && !handoff),
    saveState,
    saveProfile,
    finish,
  };
}
