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
import { DRAFT_KEY } from "./config";
import { BottomNav } from "@/components/BottomNav";
import { InstallPrompt } from "@/components/InstallPrompt";
import { LoginForm } from "@/components/login-form";
import { Route as OnboardingRoute } from "@/routes/onboarding";
import { Route as LoginRoute } from "@/routes/login";

const mocks = vi.hoisted(() => ({
  session: null as { session: { id: string } } | null,
  sessionPending: false,
  social: vi.fn(),
  upsert: vi.fn(),
  profile: null as { notificationsEnabled: boolean } | null,
  historyReplace: vi.fn(),
  historyPush: vi.fn(),
  navigate: vi.fn(),
  search: {} as { redirect?: string },
  pathname: "/onboarding",
}));

const motionMocks = vi.hoisted(() => ({ reducedMotion: false }));

const scrollMocks = vi.hoisted(() => ({ scrollIntoView: vi.fn() }));

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

vi.mock("framer-motion", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("framer-motion")>();
  return {
    ...original,
    useReducedMotion: () => motionMocks.reducedMotion,
  };
});

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: () => ({
      data: mocks.session,
      isPending: mocks.sessionPending,
    }),
    signIn: { social: mocks.social },
  },
}));

vi.mock("@/lib/api/hooks", () => ({
  useUpsertCurrentProfile: () => ({ upsertCurrentProfile: mocks.upsert }),
  useCurrentProfile: () => ({
    profile: mocks.profile,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...original,
    useRouter: () => ({
      history: { push: mocks.historyPush, replace: mocks.historyReplace },
      navigate: mocks.navigate,
      state: { location: { pathname: mocks.pathname } },
    }),
    useRouterState: (options?: {
      select?: (state: { location: { pathname: string } }) => unknown;
    }) => {
      const state = { location: { pathname: mocks.pathname } };
      return options?.select ? options.select(state) : state;
    },
    useSearch: () => mocks.search,
    useNavigate: () => mocks.navigate,
    Link: ({ children, to }: { children: ReactNode; to: string }) => (
      <a href={to}>{children}</a>
    ),
  };
});

const GOOGLE_SUCCESS = {
  data: { url: "https://accounts.google.com/o/oauth2/auth", redirect: true },
  error: null,
};

function signIn() {
  mocks.session = { session: { id: "session-1" } };
  mocks.sessionPending = false;
}

function seedDraft(
  step: "experience" | "auth",
  fitnessLevel: "beginner" | "intermediary" | "advanced" | null,
) {
  window.sessionStorage.setItem(
    DRAFT_KEY,
    JSON.stringify({ version: 2, step, fitnessLevel }),
  );
}

function readRawDraft(): string | null {
  return window.sessionStorage.getItem(DRAFT_KEY);
}

async function findHeading(name: string) {
  return screen.findByRole("heading", { name, level: 1 });
}

function entrancePanel(): HTMLElement | null {
  const panel = document.querySelector("main > div");
  return panel instanceof HTMLElement ? panel : null;
}

async function reachSetupAuth() {
  fireEvent.click(screen.getByRole("button", { name: "Set up my profile" }));
  await findHeading("Find your starting point.");
  fireEvent.click(screen.getByRole("radio", { name: /Intermediate/ }));
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  await findHeading("Keep your momentum.");
}

function renderLoginRoute() {
  const Component = LoginRoute.options.component;
  if (typeof Component !== "function") {
    throw new Error("Login route component is unavailable");
  }
  render(<Component />);
}

beforeEach(() => {
  mocks.session = null;
  mocks.sessionPending = false;
  mocks.profile = null;
  mocks.search = {};
  mocks.pathname = "/onboarding";
  motionMocks.reducedMotion = false;
  vi.clearAllMocks();
  mocks.upsert.mockReset().mockResolvedValue(undefined);
  mocks.social.mockReset().mockResolvedValue(GOOGLE_SUCCESS);
  window.sessionStorage.clear();
  mockMatchMedia();
  Element.prototype.scrollIntoView = scrollMocks.scrollIntoView;
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("onboarding google sign-in", () => {
  it("keeps a resolved google error on auth and permits retry", async () => {
    render(<OnboardingFlow />);
    await reachSetupAuth();
    mocks.social.mockResolvedValueOnce({
      data: null,
      error: { message: "Google is temporarily unavailable." },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Continue with Google" }),
    );
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toMatch(/temporarily unavailable/);
    await findHeading("Keep your momentum.");
    expect(mocks.historyPush).not.toHaveBeenCalled();
    expect(mocks.historyReplace).not.toHaveBeenCalled();
    mocks.social.mockResolvedValueOnce(GOOGLE_SUCCESS);
    fireEvent.click(
      screen.getByRole("button", { name: "Continue with Google" }),
    );
    await waitFor(() => expect(mocks.social).toHaveBeenCalledTimes(2));
    expect(mocks.historyPush).not.toHaveBeenCalled();
    expect(mocks.historyReplace).not.toHaveBeenCalled();
  });

  it("recovers the same way from a thrown network error", async () => {
    render(<OnboardingFlow />);
    await reachSetupAuth();
    mocks.social.mockRejectedValueOnce(new Error("Network request failed"));
    fireEvent.click(
      screen.getByRole("button", { name: "Continue with Google" }),
    );
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toMatch(/Network request failed/);
    await findHeading("Keep your momentum.");
    expect(mocks.historyPush).not.toHaveBeenCalled();
    expect(mocks.historyReplace).not.toHaveBeenCalled();
    mocks.social.mockResolvedValueOnce(GOOGLE_SUCCESS);
    fireEvent.click(
      screen.getByRole("button", { name: "Continue with Google" }),
    );
    await waitFor(() => expect(mocks.social).toHaveBeenCalledTimes(2));
  });

  it("clears a sign-in error when leaving and returning to the save screen", async () => {
    render(<OnboardingFlow />);
    await reachSetupAuth();
    mocks.social.mockResolvedValueOnce({
      data: null,
      error: { message: "Google is temporarily unavailable." },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Continue with Google" }),
    );
    await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("button", { name: "Go back" }));
    await findHeading("Find your starting point.");
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await findHeading("Keep your momentum.");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("sends the encoded onboarding callback without local navigation on success", async () => {
    render(<OnboardingFlow redirect="/workouts?filter=recent#stats" />);
    await reachSetupAuth();
    fireEvent.click(
      screen.getByRole("button", { name: "Continue with Google" }),
    );
    await waitFor(() =>
      expect(mocks.social).toHaveBeenCalledExactlyOnceWith({
        provider: "google",
        callbackURL:
          "/onboarding?redirect=%2Fworkouts%3Ffilter%3Drecent%23stats",
      }),
    );
    expect(mocks.historyPush).not.toHaveBeenCalled();
    expect(mocks.historyReplace).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Signing in with Google..." }),
    ).toBeTruthy();
  });

  it("sends a single request for repeated taps", async () => {
    render(<OnboardingFlow />);
    await reachSetupAuth();
    mocks.social.mockImplementationOnce(() => new Promise(() => {}));
    const button = screen.getByRole("button", {
      name: "Continue with Google",
    });
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Signing in with Google..." }),
      ).toBeTruthy(),
    );
    expect(mocks.social).toHaveBeenCalledTimes(1);
  });

  it("signs an existing account in without a profile mutation or progress rail", async () => {
    const view = render(<OnboardingFlow redirect="/workouts?filter=recent" />);
    fireEvent.click(
      screen.getByRole("button", { name: "I already have an account" }),
    );
    await findHeading("Welcome back.");
    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(screen.queryByText(/Step \d of 3/)).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: "Continue with Google" }),
    );
    await waitFor(() =>
      expect(mocks.social).toHaveBeenCalledExactlyOnceWith({
        provider: "google",
        callbackURL: "/onboarding?redirect=%2Fworkouts%3Ffilter%3Drecent",
      }),
    );
    expect(mocks.historyPush).not.toHaveBeenCalled();
    expect(mocks.historyReplace).not.toHaveBeenCalled();
    signIn();
    view.rerender(<OnboardingFlow redirect="/workouts?filter=recent" />);
    await waitFor(() =>
      expect(mocks.historyReplace).toHaveBeenCalledExactlyOnceWith(
        "/workouts?filter=recent",
      ),
    );
    expect(mocks.upsert).not.toHaveBeenCalled();
    expect(readRawDraft()).toBeNull();
  });
});

describe("onboarding questionnaire", () => {
  it("requires continue for radios before advancing", async () => {
    render(<OnboardingFlow />);
    await findHeading("Train with intent.");
    fireEvent.click(screen.getByRole("button", { name: "Set up my profile" }));
    await findHeading("Find your starting point.");
    const intermediate = screen.getByRole("radio", {
      name: /Intermediate/,
    });
    expect(intermediate.getAttribute("aria-checked")).toBe("false");
    const next = screen.getByRole("button", { name: "Continue" });
    expect(
      next instanceof HTMLButtonElement && next.disabled,
    ).toBe(true);
    fireEvent.click(intermediate);
    expect(intermediate.getAttribute("aria-checked")).toBe("true");
    expect(
      screen.queryByRole("heading", { name: "Keep your momentum." }),
    ).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    const authHeading = await findHeading("Keep your momentum.");
    await waitFor(() => expect(document.activeElement).toBe(authHeading));
  });

  it("resumes directly on experience for a valid experience draft", async () => {
    seedDraft("experience", "beginner");
    render(<OnboardingFlow />);
    await findHeading("Find your starting point.");
    expect(
      screen.queryByRole("heading", { name: "Train with intent." }),
    ).toBeNull();
    const kept = screen.getByRole("radio", { name: /Beginner/ });
    expect(kept.getAttribute("aria-checked")).toBe("true");
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("resumes directly on auth for a valid auth draft", async () => {
    seedDraft("auth", "advanced");
    render(<OnboardingFlow />);
    await findHeading("Keep your momentum.");
    expect(
      screen.getByRole("button", { name: "Continue with Google" }),
    ).toBeTruthy();
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("returns from save to experience and keeps the chosen level", async () => {
    render(<OnboardingFlow />);
    fireEvent.click(screen.getByRole("button", { name: "Set up my profile" }));
    await findHeading("Find your starting point.");
    fireEvent.click(screen.getByRole("radio", { name: /Advanced/ }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await findHeading("Keep your momentum.");
    fireEvent.click(screen.getByRole("button", { name: "Go back" }));
    await findHeading("Find your starting point.");
    const kept = screen.getByRole("radio", { name: /Advanced/ });
    expect(kept.getAttribute("aria-checked")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await findHeading("Keep your momentum.");
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it.each([
    "{broken",
    '{"version":1,"step":"auth","fitnessLevel":"advanced"}',
    '{"version":2,"step":"auth","fitnessLevel":null}',
    '{"version":2,"step":"preview","fitnessLevel":"beginner"}',
    '{"version":2,"step":"experience","fitnessLevel":"pro"}',
  ])("rejects unusable draft payload %s", async (payload) => {
    window.sessionStorage.setItem(DRAFT_KEY, payload);
    render(<OnboardingFlow />);
    await findHeading("Train with intent.");
    expect(mocks.upsert).not.toHaveBeenCalled();
    expect(mocks.historyReplace).not.toHaveBeenCalled();
  });

  it("falls back to the dashboard for a signed-in visit without a usable draft", async () => {
    window.sessionStorage.setItem(
      DRAFT_KEY,
      '{"version":2,"step":"auth","fitnessLevel":null}',
    );
    signIn();
    render(<OnboardingFlow />);
    await waitFor(() =>
      expect(mocks.historyReplace).toHaveBeenCalledExactlyOnceWith("/"),
    );
    expect(mocks.upsert).not.toHaveBeenCalled();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("uses the degraded path when storage is unavailable", async () => {
    const descriptor = Object.getOwnPropertyDescriptor(
      window,
      "sessionStorage",
    );
    Object.defineProperty(window, "sessionStorage", {
      configurable: true,
      get(): Storage {
        throw new Error("Blocked");
      },
    });
    try {
      const view = render(<OnboardingFlow />);
      fireEvent.click(
        screen.getByRole("button", { name: "Set up my profile" }),
      );
      await findHeading("Find your starting point.");
      fireEvent.click(screen.getByRole("radio", { name: /Beginner/ }));
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
      await findHeading("Keep your momentum.");
      expect(screen.getByText(/can't be kept on this device/)).toBeTruthy();
      expect(
        screen.queryByText(/Save your profile and keep your workouts/),
      ).toBeNull();
      signIn();
      view.rerender(<OnboardingFlow />);
      await waitFor(() =>
        expect(mocks.historyReplace).toHaveBeenCalledWith("/"),
      );
      expect(mocks.upsert).not.toHaveBeenCalled();
      expect(
        screen.queryByRole("heading", { name: "You’re ready to begin." }),
      ).toBeNull();
    } finally {
      if (descriptor) {
        Object.defineProperty(window, "sessionStorage", descriptor);
      } else {
        delete (window as unknown as Record<string, unknown>)[
          "sessionStorage"
        ];
      }
    }
  });
});

describe("onboarding persistence", () => {
  it("waits for session readiness then saves exactly the chosen level", async () => {
    seedDraft("auth", "advanced");
    signIn();
    mocks.sessionPending = true;
    const view = render(<OnboardingFlow />);
    await screen.findByText("Saving your profile…");
    expect(mocks.upsert).not.toHaveBeenCalled();
    mocks.sessionPending = false;
    view.rerender(<OnboardingFlow />);
    await findHeading("You’re ready to begin.");
    expect(mocks.upsert).toHaveBeenCalledExactlyOnceWith({
      updates: { fitnessLevel: "advanced" },
    });
    expect(readRawDraft()).toBeNull();
  });

  it("retains the draft on save failure and completes after retry", async () => {
    mocks.upsert.mockRejectedValueOnce(new Error("Unavailable"));
    seedDraft("auth", "advanced");
    signIn();
    render(<OnboardingFlow />);
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toMatch(/Unavailable/);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });
    expect(mocks.upsert).toHaveBeenCalledTimes(1);
    expect(readRawDraft()).not.toBeNull();
    expect(
      screen.queryByRole("heading", { name: "You’re ready to begin." }),
    ).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Retry saving" }));
    await findHeading("You’re ready to begin.");
    expect(mocks.upsert).toHaveBeenCalledTimes(2);
    expect(mocks.upsert).toHaveBeenLastCalledWith({
      updates: { fitnessLevel: "advanced" },
    });
    expect(readRawDraft()).toBeNull();
    const done = screen.getByRole("button", { name: "Get fit" });
    fireEvent.click(done);
    fireEvent.click(done);
    expect(mocks.historyReplace).toHaveBeenCalledExactlyOnceWith("/");
  });

  it("keeps the save screen mounted across status changes and reveals the action block", async () => {
    mocks.upsert.mockRejectedValue(new Error("Unavailable"));
    seedDraft("auth", "advanced");
    signIn();
    render(<OnboardingFlow />);
    const heading = await findHeading("Keep your momentum.");
    const panel = entrancePanel();
    await screen.findByRole("alert");
    expect(
      screen.getByRole("heading", { name: "Keep your momentum." }),
    ).toBe(heading);
    expect(entrancePanel()).toBe(panel);
    await waitFor(() =>
      expect(scrollMocks.scrollIntoView).toHaveBeenCalledWith({
        block: "nearest",
      }),
    );
    const callsAfterError = scrollMocks.scrollIntoView.mock.calls.length;
    expect(callsAfterError).toBeGreaterThanOrEqual(2);
    fireEvent.click(screen.getByRole("button", { name: "Retry saving" }));
    await waitFor(() =>
      expect(scrollMocks.scrollIntoView.mock.calls.length).toBeGreaterThan(
        callsAfterError,
      ),
    );
    await screen.findByRole("alert");
    expect(
      screen.getByRole("heading", { name: "Keep your momentum." }),
    ).toBe(heading);
    expect(entrancePanel()).toBe(panel);
  });

  it("clears the draft on abandonment without claiming success", async () => {
    mocks.upsert.mockRejectedValue(new Error("Unavailable"));
    seedDraft("auth", "beginner");
    signIn();
    render(<OnboardingFlow redirect="/workouts" />);
    await screen.findByRole("alert");
    fireEvent.click(
      screen.getByRole("button", { name: "Continue without saving" }),
    );
    expect(readRawDraft()).toBeNull();
    expect(mocks.historyReplace).toHaveBeenCalledExactlyOnceWith("/workouts");
    expect(
      screen.queryByRole("heading", { name: "You’re ready to begin." }),
    ).toBeNull();
  });

  it("surfaces a bounded error when readiness never arrives", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    seedDraft("auth", "intermediary");
    signIn();
    mocks.sessionPending = true;
    render(<OnboardingFlow />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(screen.getByText("Saving your profile…")).toBeTruthy();
    expect(mocks.upsert).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
    });
    expect(screen.getByText(/taking longer than expected/)).toBeTruthy();
    expect(mocks.upsert).not.toHaveBeenCalled();
    expect(readRawDraft()).not.toBeNull();
    expect(
      screen.getByRole("button", { name: "Retry saving" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Continue without saving" }),
    ).toBeTruthy();
  });

  it("ignores late mutation results after unmount", async () => {
    let resolveUpsert: (value: undefined) => void = () => {};
    mocks.upsert.mockImplementationOnce(
      () =>
        new Promise<undefined>((resolve) => {
          resolveUpsert = resolve;
        }),
    );
    seedDraft("auth", "advanced");
    signIn();
    const view = render(<OnboardingFlow />);
    await waitFor(() => expect(mocks.upsert).toHaveBeenCalledTimes(1));
    view.unmount();
    await act(async () => {
      resolveUpsert(undefined);
    });
    expect(mocks.historyReplace).not.toHaveBeenCalled();
  });

  it("cleans up the readiness timeout on unmount", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    seedDraft("auth", "advanced");
    signIn();
    mocks.sessionPending = true;
    const view = render(<OnboardingFlow />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(screen.getByText("Saving your profile…")).toBeTruthy();
    view.unmount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15000);
    });
    expect(mocks.upsert).not.toHaveBeenCalled();
    expect(mocks.historyReplace).not.toHaveBeenCalled();
  });
});

describe("onboarding layout and motion", () => {
  it("keeps progress in sync with the visible screen", async () => {
    render(<OnboardingFlow />);
    await findHeading("Train with intent.");
    expect(screen.queryByText(/Step \d of 3/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Set up my profile" }));
    await findHeading("Find your starting point.");
    expect(screen.getByText("Step 1 of 3")).toBeTruthy();
    fireEvent.click(screen.getByRole("radio", { name: /Advanced/ }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await findHeading("Keep your momentum.");
    expect(screen.getByText("Step 2 of 3")).toBeTruthy();
  });

  it("mounts only the incoming screen during the entrance fade", async () => {
    render(<OnboardingFlow />);
    await findHeading("Train with intent.");
    fireEvent.click(screen.getByRole("button", { name: "Set up my profile" }));
    expect(
      screen.queryByRole("heading", { name: "Train with intent." }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Set up my profile" }),
    ).toBeNull();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    await findHeading("Find your starting point.");
    fireEvent.click(screen.getByRole("radio", { name: /Beginner/ }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(
      screen.queryByRole("heading", {
        name: "Find your starting point.",
      }),
    ).toBeNull();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    await findHeading("Keep your momentum.");
  });

  it("fades the incoming screen in under normal motion", async () => {
    render(<OnboardingFlow />);
    await findHeading("Train with intent.");
    const panel = entrancePanel();
    expect(Number(panel?.style.opacity)).toBeLessThan(1);
    await waitFor(
      () => expect(panel?.style.opacity).toBe("1"),
      { timeout: 3000 },
    );
  });

  it("skips the entrance fade and keeps the flow usable under reduced motion", async () => {
    motionMocks.reducedMotion = true;
    render(<OnboardingFlow />);
    await findHeading("Train with intent.");
    expect(entrancePanel()?.style.opacity).not.toBe("0");
    fireEvent.click(screen.getByRole("button", { name: "Set up my profile" }));
    await findHeading("Find your starting point.");
    expect(entrancePanel()?.style.opacity).not.toBe("0");
  });

  it("keeps bottom navigation and the install prompt hidden after sign-in", async () => {
    const view = render(
      <>
        <OnboardingFlow />
        <BottomNav />
        <InstallPrompt />
      </>,
    );
    await findHeading("Train with intent.");
    await act(async () => {
      window.dispatchEvent(new Event("beforeinstallprompt"));
    });
    expect(screen.queryByText("Install Nyx Fit")).toBeNull();
    expect(screen.queryByRole("link", { name: "Home" })).toBeNull();
    signIn();
    view.rerender(
      <>
        <OnboardingFlow />
        <BottomNav />
        <InstallPrompt />
      </>,
    );
    await waitFor(() =>
      expect(mocks.historyReplace).toHaveBeenCalledWith("/"),
    );
    expect(mocks.upsert).not.toHaveBeenCalled();
    expect(screen.queryByRole("link", { name: "Home" })).toBeNull();
    expect(screen.queryByText("Install Nyx Fit")).toBeNull();
  });
});

describe("redirect validation", () => {
  it("preserves valid destinations and rejects unsafe or self-loop values", () => {
    const onboardingValidate = OnboardingRoute.options.validateSearch;
    const loginValidate = LoginRoute.options.validateSearch;
    expect(typeof onboardingValidate).toBe("function");
    expect(typeof loginValidate).toBe("function");
    if (
      typeof onboardingValidate !== "function" ||
      typeof loginValidate !== "function"
    ) {
      throw new Error("Route search validation is unavailable");
    }
    expect(
      onboardingValidate({ redirect: "/workouts?filter=recent#stats" }),
    ).toEqual({ redirect: "/workouts?filter=recent#stats" });
    expect(loginValidate({ redirect: "/workouts#stats" })).toEqual({
      redirect: "/workouts#stats",
    });
    const rejected: unknown[] = [
      "https://example.com/workouts",
      "//example.com/workouts",
      "/\\example.com",
      "/\n/example.com",
      "/login",
      "/onboarding",
      "/login?next=/workouts",
      "/onboarding#top",
      "",
      42,
      null,
    ];
    for (const redirect of rejected) {
      expect(onboardingValidate({ redirect })).toEqual({
        redirect: undefined,
      });
      expect(loginValidate({ redirect })).toEqual({ redirect: undefined });
    }
  });
});

describe("standalone login", () => {
  it("stays on login with a retryable error for a resolved google error", async () => {
    render(<LoginForm />);
    expect(screen.getByRole("heading", { name: "Welcome Back" })).toBeTruthy();
    expect(
      screen.getByText("Sign in with Google to continue"),
    ).toBeTruthy();
    mocks.social.mockResolvedValueOnce({
      data: null,
      error: { message: "Google sign-in failed. Please try again." },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Continue with Google" }),
    );
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toMatch(/Please try again/);
    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(mocks.historyPush).not.toHaveBeenCalled();
    mocks.social.mockResolvedValueOnce(GOOGLE_SUCCESS);
    fireEvent.click(
      screen.getByRole("button", { name: "Continue with Google" }),
    );
    await waitFor(() => expect(mocks.social).toHaveBeenCalledTimes(2));
  });

  it("sends the login callback url without local navigation on success", async () => {
    render(<LoginForm callbackURL="/login?redirect=%2Fworkouts" />);
    fireEvent.click(
      screen.getByRole("button", { name: "Continue with Google" }),
    );
    await waitFor(() =>
      expect(mocks.social).toHaveBeenCalledExactlyOnceWith({
        provider: "google",
        callbackURL: "/login?redirect=%2Fworkouts",
      }),
    );
    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(mocks.historyPush).not.toHaveBeenCalled();
  });

  it("finishes the authenticated callback through the login route", async () => {
    mocks.search = { redirect: "/workouts" };
    signIn();
    renderLoginRoute();
    await waitFor(() =>
      expect(mocks.historyPush).toHaveBeenCalledExactlyOnceWith("/workouts"),
    );
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("returns to the dashboard by default and links to profile setup", async () => {
    mocks.search = {};
    signIn();
    renderLoginRoute();
    await waitFor(() =>
      expect(mocks.navigate).toHaveBeenCalledExactlyOnceWith({ to: "/" }),
    );
    cleanup();
    mocks.session = null;
    renderLoginRoute();
    expect(
      screen.getByRole("link", { name: "New here? Set up your profile" }),
    ).toBeTruthy();
  });
});

function installFakeNotification(
  permission: "granted" | "denied" | "default",
) {
  const requestPermission = vi.fn(async () => permission);
  const FakeNotification = Object.assign(function (this: unknown) {}, {
    permission,
    requestPermission,
  });
  vi.stubGlobal("Notification", FakeNotification);
  return requestPermission;
}

describe("onboarding reminders", () => {
  it("requests permission and saves the reminders opt-in on the ready screen", async () => {
    const requestPermission = installFakeNotification("granted");
    seedDraft("auth", "advanced");
    signIn();
    render(<OnboardingFlow />);
    await findHeading("You’re ready to begin.");
    expect(mocks.upsert).toHaveBeenCalledExactlyOnceWith({
      updates: { fitnessLevel: "advanced" },
    });

    fireEvent.click(screen.getByRole("switch"));

    await waitFor(() =>
      expect(mocks.upsert).toHaveBeenLastCalledWith({
        updates: { notificationsEnabled: true },
      }),
    );
    expect(requestPermission).toHaveBeenCalledTimes(1);
  });

  it("shows an error and skips persistence when permission is denied", async () => {
    installFakeNotification("denied");
    seedDraft("auth", "advanced");
    signIn();
    render(<OnboardingFlow />);
    await findHeading("You’re ready to begin.");

    fireEvent.click(screen.getByRole("switch"));

    await screen.findByRole("alert");
    expect(screen.getByRole("alert").textContent).toMatch(/blocked/);
    expect(mocks.upsert).toHaveBeenCalledTimes(1);
  });

  it("persists the opt-out without requesting permission when reminders are already on", async () => {
    installFakeNotification("granted");
    seedDraft("auth", "advanced");
    signIn();
    render(<OnboardingFlow />);
    await findHeading("You’re ready to begin.");

    fireEvent.click(screen.getByRole("switch"));
    await waitFor(() =>
      expect(mocks.upsert).toHaveBeenLastCalledWith({
        updates: { notificationsEnabled: true },
      }),
    );

    fireEvent.click(screen.getByRole("switch"));
    await waitFor(() =>
      expect(mocks.upsert).toHaveBeenLastCalledWith({
        updates: { notificationsEnabled: false },
      }),
    );
  });

  it("ignores a second toggle while a request is pending", async () => {
    const requestPermission = installFakeNotification("granted");
    let resolvePermission: (
      value: "granted" | "denied" | "default",
    ) => void = () => {};
    requestPermission.mockImplementationOnce(
      () =>
        new Promise<"granted" | "denied" | "default">((resolve) => {
          resolvePermission = resolve;
        }),
    );
    seedDraft("auth", "advanced");
    signIn();
    render(<OnboardingFlow />);
    await findHeading("You’re ready to begin.");

    const toggle = screen.getByRole("switch");
    fireEvent.click(toggle);
    expect(
      toggle instanceof HTMLButtonElement && toggle.disabled,
    ).toBe(true);
    fireEvent.click(toggle);
    expect(requestPermission).toHaveBeenCalledTimes(1);
    expect(mocks.upsert).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolvePermission("granted");
    });
    await waitFor(() =>
      expect(mocks.upsert).toHaveBeenLastCalledWith({
        updates: { notificationsEnabled: true },
      }),
    );
    expect(requestPermission).toHaveBeenCalledTimes(1);
    expect(mocks.upsert).toHaveBeenCalledTimes(2);
  });

  it("hydrates the reminders toggle from the saved profile", async () => {
    installFakeNotification("granted");
    mocks.profile = { notificationsEnabled: true };
    seedDraft("auth", "advanced");
    signIn();
    render(<OnboardingFlow />);
    await findHeading("You’re ready to begin.");

    await waitFor(() =>
      expect(screen.getByRole("switch").getAttribute("aria-checked")).toBe(
        "true",
      ),
    );
    expect(mocks.upsert).toHaveBeenCalledExactlyOnceWith({
      updates: { fitnessLevel: "advanced" },
    });
  });

  it("keeps a toggle made before the saved profile arrives", async () => {
    installFakeNotification("granted");
    seedDraft("auth", "advanced");
    signIn();
    const view = render(<OnboardingFlow />);
    await findHeading("You’re ready to begin.");

    fireEvent.click(screen.getByRole("switch"));
    await waitFor(() =>
      expect(mocks.upsert).toHaveBeenLastCalledWith({
        updates: { notificationsEnabled: true },
      }),
    );

    mocks.profile = { notificationsEnabled: false };
    view.rerender(<OnboardingFlow />);
    expect(
      screen.getByRole("switch").getAttribute("aria-checked"),
    ).toBe("true");
  });
});
