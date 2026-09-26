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
import { LoginForm } from "@/components/login-form";
import { Route as OnboardingRoute } from "@/routes/onboarding";
import { Route as LoginRoute } from "@/routes/login";

const mocks = vi.hoisted(() => ({
  session: null as { session: { id: string } } | null,
  sessionPending: false,
  social: vi.fn(),
  signInEmail: vi.fn(),
  signUpEmail: vi.fn(),
  upsert: vi.fn(),
  profile: null as { notificationsEnabled: boolean } | null,
  historyReplace: vi.fn(),
  historyPush: vi.fn(),
  navigate: vi.fn(),
  search: {} as { redirect?: string },
  pathname: "/onboarding",
}));

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

const EMAIL_SUCCESS = {
  data: { user: { id: "user-1" } },
  error: null,
};

function signIn() {
  mocks.session = { session: { id: "session-1" } };
  mocks.sessionPending = false;
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
  vi.clearAllMocks();
  mocks.upsert.mockReset().mockResolvedValue(undefined);
  mocks.social.mockReset().mockResolvedValue(GOOGLE_SUCCESS);
  mocks.signInEmail.mockReset().mockResolvedValue(EMAIL_SUCCESS);
  mocks.signUpEmail.mockReset().mockResolvedValue(EMAIL_SUCCESS);
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

  it("signs in with email and blocks a parallel google request", async () => {
    let resolveEmail: (value: typeof EMAIL_SUCCESS) => void = () => {};
    mocks.signInEmail.mockImplementationOnce(
      () =>
        new Promise<typeof EMAIL_SUCCESS>((resolve) => {
          resolveEmail = resolve;
        }),
    );
    render(<LoginForm />);
    fireEvent.click(
      screen.getByRole("button", { name: "Sign in with email instead" }),
    );
    await screen.findByRole("textbox", { name: "Email" });
    fireEvent.change(screen.getByRole("textbox", { name: "Email" }), {
      target: { value: "member@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "hunter2hunter2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() =>
      expect(mocks.signInEmail).toHaveBeenCalledExactlyOnceWith({
        email: "member@example.com",
        password: "hunter2hunter2",
      }),
    );
    const google = screen.getByRole("button", {
      name: "Continue with Google",
    });
    expect(google instanceof HTMLButtonElement && google.disabled).toBe(true);
    fireEvent.click(google);
    expect(mocks.social).not.toHaveBeenCalled();
    await act(async () => {
      resolveEmail(EMAIL_SUCCESS);
    });
    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(mocks.historyPush).not.toHaveBeenCalled();
  });

  it("hides the email option while google is in flight", async () => {
    mocks.social.mockImplementationOnce(() => new Promise(() => {}));
    render(<LoginForm />);
    expect(
      screen.getByRole("button", { name: "Sign in with email instead" }),
    ).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Continue with Google" }),
    );
    await screen.findByRole("button", { name: "Signing in with Google..." });
    expect(
      screen.queryByRole("button", { name: "Sign in with email instead" }),
    ).toBeNull();
    expect(screen.queryByRole("textbox", { name: "Email" })).toBeNull();
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
