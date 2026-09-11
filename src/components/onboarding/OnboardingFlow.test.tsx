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
  convexLoading: true,
  convexAuthenticated: false,
  social: vi.fn(),
  upsert: vi.fn(),
  historyReplace: vi.fn(),
  historyPush: vi.fn(),
  navigate: vi.fn(),
  search: {} as { redirect?: string },
  pathname: "/onboarding",
}));

const motionMocks = vi.hoisted(() => ({ reducedMotion: false }));

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

vi.mock("convex/react", () => ({
  useConvexAuth: () => ({
    isLoading: mocks.convexLoading,
    isAuthenticated: mocks.convexAuthenticated,
  }),
}));

vi.mock("@/lib/convex/hooks", () => ({
  useUpsertCurrentProfile: () => ({ upsertCurrentProfile: mocks.upsert }),
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
  await findHeading("What is your training experience?");
  fireEvent.click(screen.getByRole("radio", { name: /Intermediate/ }));
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  await findHeading("Save your profile.");
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
  mocks.convexLoading = true;
  mocks.convexAuthenticated = false;
  mocks.search = {};
  mocks.pathname = "/onboarding";
  motionMocks.reducedMotion = false;
  vi.clearAllMocks();
  mocks.upsert.mockReset().mockResolvedValue(undefined);
  mocks.social.mockReset().mockResolvedValue(GOOGLE_SUCCESS);
  window.sessionStorage.clear();
  mockMatchMedia();
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
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
    await findHeading("Save your profile.");
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
    await findHeading("Save your profile.");
    expect(mocks.historyPush).not.toHaveBeenCalled();
    expect(mocks.historyReplace).not.toHaveBeenCalled();
    mocks.social.mockResolvedValueOnce(GOOGLE_SUCCESS);
    fireEvent.click(
      screen.getByRole("button", { name: "Continue with Google" }),
    );
    await waitFor(() => expect(mocks.social).toHaveBeenCalledTimes(2));
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
    expect(screen.queryByText(/Step \d of 4/)).toBeNull();
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
  it("requires continue for radios and preserves the answer on back", async () => {
    render(<OnboardingFlow />);
    await findHeading("Train with intent.");
    fireEvent.click(screen.getByRole("button", { name: "Set up my profile" }));
    const experienceHeading = await findHeading(
      "What is your training experience?",
    );
    const intermediate = screen.getByRole("radio", {
      name: /Intermediate/,
    });
    expect(intermediate instanceof HTMLInputElement).toBe(true);
    const next = screen.getByRole("button", { name: "Continue" });
    expect(
      next instanceof HTMLButtonElement && next.disabled,
    ).toBe(true);
    fireEvent.click(intermediate);
    await findHeading("What is your training experience?");
    expect(
      screen.queryByRole("heading", { name: "Save your profile." }),
    ).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    const authHeading = await findHeading("Save your profile.");
    await waitFor(() => expect(document.activeElement).toBe(authHeading));
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    await findHeading("What is your training experience?");
    const kept = screen.getByRole("radio", { name: /Intermediate/ });
    expect(kept instanceof HTMLInputElement && kept.checked).toBe(true);
    expect(experienceHeading.textContent).toContain("training experience");
  });

  it("restores a valid experience draft on remount", async () => {
    seedDraft("experience", "beginner");
    render(<OnboardingFlow />);
    await findHeading("What is your training experience?");
    const kept = screen.getByRole("radio", { name: /Beginner/ });
    expect(kept instanceof HTMLInputElement && kept.checked).toBe(true);
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("resumes directly on auth for a valid auth draft", async () => {
    seedDraft("auth", "advanced");
    render(<OnboardingFlow />);
    await findHeading("Save your profile.");
    expect(
      screen.getByRole("button", { name: "Continue with Google" }),
    ).toBeTruthy();
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
      await findHeading("What is your training experience?");
      fireEvent.click(screen.getByRole("radio", { name: /Beginner/ }));
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
      await findHeading("Save your profile.");
      expect(screen.getByText(/can't be kept on this device/)).toBeTruthy();
      expect(
        screen.queryByText(/save your training experience and track/),
      ).toBeNull();
      signIn();
      view.rerender(<OnboardingFlow />);
      await waitFor(() =>
        expect(mocks.historyReplace).toHaveBeenCalledWith("/"),
      );
      expect(mocks.upsert).not.toHaveBeenCalled();
      expect(
        screen.queryByRole("heading", { name: "Your profile is ready." }),
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
  it("waits for convex readiness then saves exactly the chosen level", async () => {
    seedDraft("auth", "advanced");
    signIn();
    mocks.convexLoading = true;
    mocks.convexAuthenticated = false;
    const view = render(<OnboardingFlow />);
    await screen.findByText("Saving your profile…");
    expect(mocks.upsert).not.toHaveBeenCalled();
    mocks.convexLoading = false;
    mocks.convexAuthenticated = true;
    view.rerender(<OnboardingFlow />);
    await findHeading("Your profile is ready.");
    expect(mocks.upsert).toHaveBeenCalledExactlyOnceWith({
      updates: { fitnessLevel: "advanced" },
    });
    expect(readRawDraft()).toBeNull();
  });

  it("retains the draft on save failure and completes after retry", async () => {
    mocks.upsert.mockRejectedValueOnce(new Error("Unavailable"));
    seedDraft("auth", "advanced");
    signIn();
    mocks.convexLoading = false;
    mocks.convexAuthenticated = true;
    render(<OnboardingFlow />);
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toMatch(/Unavailable/);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });
    expect(mocks.upsert).toHaveBeenCalledTimes(1);
    expect(readRawDraft()).not.toBeNull();
    expect(
      screen.queryByRole("heading", { name: "Your profile is ready." }),
    ).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Retry saving" }));
    await findHeading("Your profile is ready.");
    expect(mocks.upsert).toHaveBeenCalledTimes(2);
    expect(mocks.upsert).toHaveBeenLastCalledWith({
      updates: { fitnessLevel: "advanced" },
    });
    expect(readRawDraft()).toBeNull();
    const done = screen.getByRole("button", { name: "Open dashboard" });
    fireEvent.click(done);
    fireEvent.click(done);
    expect(mocks.historyReplace).toHaveBeenCalledExactlyOnceWith("/");
  });

  it("clears the draft on abandonment without claiming success", async () => {
    mocks.upsert.mockRejectedValue(new Error("Unavailable"));
    seedDraft("auth", "beginner");
    signIn();
    mocks.convexLoading = false;
    mocks.convexAuthenticated = true;
    render(<OnboardingFlow redirect="/workouts" />);
    await screen.findByRole("alert");
    fireEvent.click(
      screen.getByRole("button", { name: "Continue without saving" }),
    );
    expect(readRawDraft()).toBeNull();
    expect(mocks.historyReplace).toHaveBeenCalledExactlyOnceWith("/workouts");
    expect(
      screen.queryByRole("heading", { name: "Your profile is ready." }),
    ).toBeNull();
  });

  it("surfaces a bounded error when readiness never arrives", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    seedDraft("auth", "intermediary");
    signIn();
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
    mocks.convexLoading = false;
    mocks.convexAuthenticated = true;
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
    expect(screen.queryByText("Built around you")).toBeNull();
    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(screen.queryByText(/Step \d of 4/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Set up my profile" }));
    await findHeading("What is your training experience?");
    expect(
      screen.getByRole("progressbar").getAttribute("aria-valuenow"),
    ).toBe("2");
    expect(screen.getByText("Step 2 of 4")).toBeTruthy();
    fireEvent.click(screen.getByRole("radio", { name: /Advanced/ }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await findHeading("Save your profile.");
    expect(
      screen.getByRole("progressbar").getAttribute("aria-valuenow"),
    ).toBe("3");
    expect(screen.getByText("Step 3 of 4")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    await findHeading("What is your training experience?");
    expect(
      screen.getByRole("progressbar").getAttribute("aria-valuenow"),
    ).toBe("2");
    expect(screen.getByText("Step 2 of 4")).toBeTruthy();
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
    await findHeading("What is your training experience?");
    fireEvent.click(screen.getByRole("radio", { name: /Beginner/ }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(
      screen.queryByRole("heading", {
        name: "What is your training experience?",
      }),
    ).toBeNull();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    await findHeading("Save your profile.");
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
    await findHeading("What is your training experience?");
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
    mocks.convexLoading = false;
    mocks.convexAuthenticated = true;
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
