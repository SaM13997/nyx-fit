import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { OnboardingFlow } from "./OnboardingFlow";
import { BuildingStep } from "./BuildingStep";
import { LoggerPeekStep } from "./PreviewSteps";
import { BottomNav } from "@/components/BottomNav";
import { LoginForm } from "@/components/login-form";
import { Route } from "@/routes/onboarding";
import {
  STAGED_KEY,
  buildSequence,
  derivePlan,
  readStagedOnboarding,
  writeStaged,
  type QuizAnswers,
} from "./config";

const mocks = vi.hoisted(() => ({
  signedIn: false,
  push: vi.fn(),
  navigate: vi.fn(),
  upsert: vi.fn().mockResolvedValue(undefined),
  email: vi.fn().mockResolvedValue(undefined),
  social: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: () => ({
      data: mocks.signedIn ? { session: { id: "session" } } : null,
      isPending: false,
    }),
    signIn: { email: mocks.email, social: mocks.social },
  },
}));
vi.mock("@/lib/convex/hooks", () => ({
  useUpsertCurrentProfile: () => ({ upsertCurrentProfile: mocks.upsert }),
}));
vi.mock("@tanstack/react-router", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@tanstack/react-router")>();
  const history = { push: mocks.push };
  return {
    ...original,
    useRouter: () => ({
      history,
      navigate: mocks.navigate,
      state: { location: { search: {} } },
    }),
    useRouterState: () => "/onboarding",
    Link: ({ children, to }: { children: ReactNode; to: string }) => (
      <a href={to}>{children}</a>
    ),
  };
});

beforeEach(() => {
  mocks.signedIn = false;
  vi.clearAllMocks();
  mocks.upsert.mockReset().mockResolvedValue(undefined);
  mocks.email.mockReset().mockResolvedValue(undefined);
  mocks.social.mockReset().mockResolvedValue(undefined);
  window.sessionStorage.clear();
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: (query: string) => ({
      matches: true,
      media: query,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

async function heading(name: string) {
  const element = await screen.findByRole(
    "heading",
    { name, level: 1 },
    { timeout: 4000 },
  );
  await waitFor(() => expect(document.activeElement).toBe(element));
  return element;
}

async function reachAuth(coach = false) {
  fireEvent.click(screen.getByRole("button", { name: "Get Started" }));
  await heading("What are you chasing?");
  fireEvent.click(
    screen.getByRole("radio", {
      name: coach ? /I coach others/ : /Build muscle/,
    }),
  );
  if (!coach) {
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await heading("How many days did you train last week?");
    fireEvent.click(screen.getByRole("radio", { name: /3–4 days/ }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await heading("Set your week.");
    expect(
      screen.getByRole("radio", { name: "4 days" }).getAttribute("checked"),
    ).not.toBeNull();
    expect(
      screen
        .getByRole("button", { name: "Dumbbells" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Build my plan" }));
  }
  await heading("Your first week");
  expect(readStagedOnboarding()).toEqual({
    goal: coach ? "coach" : "build-muscle",
    fitnessLevel: coach ? null : "intermediary",
  });
  expect(screen.getByRole("progressbar").getAttribute("aria-valuemax")).toBe(
    coach ? "7" : "9",
  );
  fireEvent.click(screen.getByRole("button", { name: "Looks right" }));
  await heading("Logging takes seconds.");
  fireEvent.click(screen.getByRole("button", { name: "Complete preview set" }));
  await heading("Save your plan.");
}

describe("onboarding handoffs", () => {
  it("preserves answers and credited progress when going back", async () => {
    render(<OnboardingFlow />);
    fireEvent.click(screen.getByRole("button", { name: "Get Started" }));
    await heading("What are you chasing?");
    fireEvent.click(screen.getByRole("radio", { name: /Get stronger/ }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await heading("How many days did you train last week?");
    const reached = screen
      .getByRole("progressbar")
      .getAttribute("aria-valuenow");
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    await heading("What are you chasing?");
    expect(
      screen.getByRole("radio", { name: /Get stronger/, checked: true }),
    ).toBeTruthy();
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe(
      reached,
    );
  });

  it("keeps email sign-in on Done, commits once, and hides BottomNav", async () => {
    const view = render(
      <>
        <OnboardingFlow redirect="/workouts" />
        <BottomNav />
      </>,
    );
    expect(document.activeElement).toBe(document.body);
    await reachAuth();
    mocks.email.mockImplementationOnce(async () => {
      mocks.signedIn = true;
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Email address" }), {
      target: { value: "lifter@example.com" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Continue with Email" }),
    );
    await heading("You're set.");
    view.rerender(
      <>
        <OnboardingFlow redirect="/workouts" />
        <BottomNav />
      </>,
    );
    expect(mocks.upsert).toHaveBeenCalledExactlyOnceWith({
      updates: { fitnessLevel: "intermediary" },
    });
    expect(mocks.push).not.toHaveBeenCalled();
    expect(screen.queryByRole("link", { name: "Home" })).toBeNull();
    expect(readStagedOnboarding()).toBeNull();
    const finish = screen.getByRole("button", { name: "Start first workout" });
    fireEvent.click(finish);
    fireEvent.click(finish);
    expect(mocks.push).toHaveBeenCalledExactlyOnceWith("/workouts");
  });

  it("completes the seven-step coach path without writing a fitness level", async () => {
    render(<OnboardingFlow />);
    await reachAuth(true);
    fireEvent.change(screen.getByRole("textbox", { name: "Email address" }), {
      target: { value: "coach@example.com" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Continue with Email" }),
    );
    await heading("You're set.");
    expect(mocks.upsert).not.toHaveBeenCalled();
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe(
      "7",
    );
    expect(readStagedOnboarding()).toBeNull();
  });

  it("clears staged answers when saving is skipped", async () => {
    render(<OnboardingFlow />);
    await reachAuth();
    fireEvent.click(
      screen.getByRole("button", { name: "Not now — explore without saving" }),
    );
    await heading("You're set.");
    expect(readStagedOnboarding()).toBeNull();
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("preserves the Google callback and commits staged answers after a full-page return", async () => {
    const view = render(<OnboardingFlow redirect="/workouts?filter=recent" />);
    fireEvent.click(
      screen.getByRole("button", { name: "I already have an account" }),
    );
    await heading("Save your plan.");
    writeStaged({ goal: "get-stronger", fitnessLevel: "advanced" });
    mocks.social.mockImplementationOnce(() => new Promise(() => {}));
    fireEvent.click(screen.getByRole("button", { name: "Google" }));
    expect(mocks.social).toHaveBeenCalledExactlyOnceWith({
      provider: "google",
      callbackURL: "/onboarding?redirect=%2Fworkouts%3Ffilter%3Drecent",
    });
    expect(mocks.push).not.toHaveBeenCalled();
    view.unmount();
    mocks.signedIn = true;
    render(<OnboardingFlow redirect="/workouts?filter=recent" />);
    await waitFor(() =>
      expect(mocks.push).toHaveBeenCalledExactlyOnceWith(
        "/workouts?filter=recent",
      ),
    );
    expect(mocks.upsert).toHaveBeenCalledExactlyOnceWith({
      updates: { fitnessLevel: "advanced" },
    });
    expect(readStagedOnboarding()).toBeNull();
  });

  it.each([
    null,
    "{broken",
    '{"goal":"coach","fitnessLevel":null}',
    '{"goal":"coach","fitnessLevel":"pro"}',
  ])(
    "silently returns home without mutation for staged payload %s",
    async (payload) => {
      if (payload) window.sessionStorage.setItem(STAGED_KEY, payload);
      mocks.signedIn = true;
      render(<OnboardingFlow />);
      await waitFor(() =>
        expect(mocks.push).toHaveBeenCalledExactlyOnceWith("/"),
      );
      expect(mocks.upsert).not.toHaveBeenCalled();
      expect(screen.queryByRole("alert")).toBeNull();
    },
  );

  it("retries persistence once and still redirects when both attempts fail", async () => {
    vi.useFakeTimers();
    writeStaged({ goal: "build-muscle", fitnessLevel: "beginner" });
    mocks.upsert.mockRejectedValue(new Error("Unavailable"));
    mocks.signedIn = true;
    render(<OnboardingFlow />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });
    expect(mocks.upsert).toHaveBeenCalledTimes(2);
    expect(mocks.push).toHaveBeenCalledExactlyOnceWith("/");
    expect(readStagedOnboarding()).toBeNull();
  });

  it("cancels the persistence retry and redirect after unmount", async () => {
    vi.useFakeTimers();
    writeStaged({ goal: "build-muscle", fitnessLevel: "beginner" });
    mocks.upsert.mockRejectedValue(new Error("Unavailable"));
    mocks.signedIn = true;
    const view = render(<OnboardingFlow />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    view.unmount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });
    expect(mocks.upsert).toHaveBeenCalledTimes(1);
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("keeps standalone LoginForm defaults and email navigation", async () => {
    render(<LoginForm />);
    expect(screen.getByRole("heading", { name: "Welcome Back" })).toBeTruthy();
    expect(
      screen.getByText("Enter your email to sign in or create an account"),
    ).toBeTruthy();
    fireEvent.change(screen.getByRole("textbox", { name: "Email address" }), {
      target: { value: "lifter@example.com" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Continue with Email" }),
    );
    await waitFor(() =>
      expect(mocks.navigate).toHaveBeenCalledExactlyOnceWith({ to: "/" }),
    );
  });
});

describe("onboarding inputs", () => {
  it("uses the reduced-motion building deadline and clears it on unmount", async () => {
    vi.useFakeTimers();
    const onContinue = vi.fn();
    const answers: QuizAnswers = {
      goal: "coach",
      lastWeekSessions: null,
      daysPerWeek: null,
      equipment: [],
    };
    const view = render(
      <BuildingStep answers={answers} onContinue={onContinue} />,
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(499);
    });
    expect(onContinue).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(onContinue).toHaveBeenCalledTimes(1);
    view.unmount();
    onContinue.mockClear();
    const next = render(
      <BuildingStep answers={answers} onContinue={onContinue} />,
    );
    next.unmount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(onContinue).not.toHaveBeenCalled();
  });

  it("clears the logger auto-advance when its preview is unmounted", async () => {
    vi.useFakeTimers();
    const onContinue = vi.fn();
    const view = render(<LoggerPeekStep onContinue={onContinue} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Complete preview set" }),
    );
    view.unmount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1200);
    });
    expect(onContinue).not.toHaveBeenCalled();
  });

  it("scales the preview to every supported week length", () => {
    const answers: QuizAnswers = {
      goal: "build-muscle",
      lastWeekSessions: "0",
      daysPerWeek: null,
      equipment: [],
    };
    for (const days of [2, 3, 4, 5] satisfies QuizAnswers["daysPerWeek"][]) {
      expect(
        derivePlan({ ...answers, daysPerWeek: days }).sessions,
      ).toHaveLength(days);
    }
    expect(buildSequence("coach")).toHaveLength(7);
    expect(buildSequence("get-stronger")).toHaveLength(9);
  });

  it("rejects malformed storage and tolerates unavailable storage", () => {
    window.sessionStorage.setItem(
      STAGED_KEY,
      '{"goal":"build-muscle","fitnessLevel":42}',
    );
    expect(readStagedOnboarding()).toBeNull();
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("Blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Blocked");
    });
    expect(readStagedOnboarding()).toBeNull();
    expect(() =>
      writeStaged({ goal: "coach", fitnessLevel: null }),
    ).not.toThrow();
  });

  it.each([
    "https://example.com",
    "//example.com",
    "/\\example.com",
    "/\n/example.com",
    42,
  ])("rejects unsafe redirect %s", (redirect) => {
    const validate = Route.options.validateSearch;
    expect(typeof validate === "function" && validate({ redirect })).toEqual({
      redirect: undefined,
    });
  });
});
