import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { DRAFT_KEY } from "@/components/onboarding/config";

const mocks = vi.hoisted(() => ({
  session: null as { session: { id: string } } | null,
  sessionPending: false,
  social: vi.fn(),
  signInEmail: vi.fn(),
  signUpEmail: vi.fn(),
  upsert: vi.fn(),
  historyReplace: vi.fn(),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: () => ({
      data: mocks.session,
      isPending: mocks.sessionPending,
    }),
    signIn: { social: mocks.social, email: mocks.signInEmail },
    signUp: { email: mocks.signUpEmail },
  },
}));

vi.mock("@/lib/api/hooks", () => ({
  useUpsertCurrentProfile: () => ({ upsertCurrentProfile: mocks.upsert }),
}));

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...original,
    useRouter: () => ({
      history: { push: vi.fn(), replace: mocks.historyReplace },
      navigate: vi.fn(),
      state: { location: { pathname: "/onboarding" } },
    }),
    Link: ({ children, to }: { children: ReactNode; to: string }) => (
      <a href={to}>{children}</a>
    ),
  };
});

function mockMatchMedia() {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

function signIn() {
  mocks.session = { session: { id: "session-1" } };
}

function seedDraft(step: "experience" | "auth", fitnessLevel: string | null) {
  window.sessionStorage.setItem(
    DRAFT_KEY,
    JSON.stringify({ version: 2, step, fitnessLevel }),
  );
}

const heading = (name: string) => screen.findByRole("heading", { name });

async function reachAuth(level: RegExp) {
  await heading("Train with intent.");
  fireEvent.click(screen.getByRole("button", { name: /Get started/ }));
  await heading("Where are you starting from?");
  fireEvent.click(screen.getByRole("radio", { name: level }));
  fireEvent.click(screen.getByRole("button", { name: /Next/ }));
  await heading("Keep your momentum.");
}

beforeEach(() => {
  mocks.session = null;
  mocks.sessionPending = false;
  vi.clearAllMocks();
  mocks.upsert.mockReset().mockResolvedValue(undefined);
  window.sessionStorage.clear();
  mockMatchMedia();
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("OnboardingFlow", () => {
  it("preselects the middle level and lets the user change it", async () => {
    render(<OnboardingFlow />);
    await heading("Train with intent.");
    fireEvent.click(screen.getByRole("button", { name: /Get started/ }));
    await heading("Where are you starting from?");

    const intermediate = screen.getByRole("radio", { name: "Intermediate" });
    expect(intermediate instanceof HTMLInputElement && intermediate.checked).toBe(true);

    fireEvent.click(screen.getByRole("radio", { name: "Advanced" }));
    expect(window.sessionStorage.getItem(DRAFT_KEY)).toContain('"fitnessLevel":"advanced"');
    expect(screen.getByText("Runs their own programming.")).toBeTruthy();
  });

  it("saves the chosen level for new setup once the session appears", async () => {
    const { rerender } = render(<OnboardingFlow redirect="/workouts" />);
    await reachAuth(/Beginner/);
    expect(window.sessionStorage.getItem(DRAFT_KEY)).toContain('"step":"auth"');

    signIn();
    rerender(<OnboardingFlow redirect="/workouts" />);
    await waitFor(() =>
      expect(mocks.upsert).toHaveBeenCalledExactlyOnceWith({
        updates: { fitnessLevel: "beginner" },
      }),
    );
    expect(await heading("You’re ready to begin.")).toBeTruthy();
    expect(window.sessionStorage.getItem(DRAFT_KEY)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(mocks.historyReplace).toHaveBeenCalledExactlyOnceWith("/workouts");
  });

  it("drops a stale setup draft on the existing-account path and never saves it", async () => {
    seedDraft("auth", "beginner");
    const { rerender } = render(<OnboardingFlow />);
    await heading("Keep your momentum.");

    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    await heading("Where are you starting from?");
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    await heading("Train with intent.");

    fireEvent.click(screen.getByRole("button", { name: "I have an account" }));
    await heading("Welcome back.");
    expect(window.sessionStorage.getItem(DRAFT_KEY)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    await heading("Train with intent.");
    fireEvent.click(screen.getByRole("button", { name: "I have an account" }));
    await heading("Welcome back.");

    signIn();
    rerender(<OnboardingFlow />);
    await waitFor(() =>
      expect(mocks.historyReplace).toHaveBeenCalledExactlyOnceWith("/"),
    );
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("shows a retryable error when the profile save fails", async () => {
    mocks.upsert.mockRejectedValueOnce(new Error("boom"));
    const { rerender } = render(<OnboardingFlow />);
    await reachAuth(/Advanced/);

    signIn();
    rerender(<OnboardingFlow />);
    expect((await screen.findByRole("alert")).textContent).toMatch(/boom/);

    fireEvent.click(screen.getByRole("button", { name: "Retry saving" }));
    expect(await heading("You’re ready to begin.")).toBeTruthy();
    expect(mocks.upsert).toHaveBeenCalledTimes(2);
  });

  it("clears the draft when continuing after a failed save", async () => {
    mocks.upsert.mockRejectedValueOnce(new Error("Could not save"));
    const { rerender } = render(<OnboardingFlow redirect="/workouts" />);
    await reachAuth(/Beginner/);

    signIn();
    rerender(<OnboardingFlow redirect="/workouts" />);
    await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("button", { name: "Continue without saving" }));

    expect(window.sessionStorage.getItem(DRAFT_KEY)).toBeNull();
    expect(mocks.upsert).toHaveBeenCalledTimes(1);
    expect(mocks.historyReplace).toHaveBeenCalledExactlyOnceWith("/workouts");
  });

  it("moves focus to the new heading on step change", async () => {
    render(<OnboardingFlow />);
    const welcome = await heading("Train with intent.");
    await waitFor(() => expect(document.activeElement).toBe(welcome));

    fireEvent.click(screen.getByRole("button", { name: /Get started/ }));
    const experience = await heading("Where are you starting from?");
    await waitFor(() => expect(document.activeElement).toBe(experience));
  });

  it("moves focus into the email form and returns it on collapse", async () => {
    render(<OnboardingFlow />);
    await reachAuth(/Beginner/);

    const trigger = screen.getByRole("button", { name: "Sign up with email instead" });
    fireEvent.click(trigger);
    const email = await screen.findByRole("textbox", { name: "Email" });
    await waitFor(() => expect(document.activeElement).toBe(email));
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: /Continue with Google/ })).toBeNull(),
    );

    fireEvent.click(screen.getByRole("button", { name: "Back to Google" }));
    await waitFor(() => expect(document.activeElement).toBe(trigger));
    expect(screen.getByRole("button", { name: /Continue with Google/ })).toBeTruthy();
  });
});
