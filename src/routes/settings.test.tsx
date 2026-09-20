import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NotificationPermissionState } from "@/lib/notifications";
import { Route } from "./settings";

const mocks = vi.hoisted(() => ({
  session: { session: { id: "session-1" } } as
    | { session: { id: string } }
    | null,
  profile: null as { notificationsEnabled: boolean } | null,
  upsert: vi.fn(),
  showError: vi.fn(),
  requestPermission: vi.fn<() => Promise<NotificationPermissionState>>(),
  permission: "default" as NotificationPermissionState,
  constructed: [] as { title: string; options: unknown }[],
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: () => ({ data: mocks.session, isPending: false }),
  },
}));

vi.mock("@/lib/api/hooks", () => ({
  useCurrentProfile: () => ({
    profile: mocks.profile,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useUpsertCurrentProfile: () => ({
    upsertCurrentProfile: mocks.upsert,
    isPending: false,
  }),
}));

vi.mock("@/lib/toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
    success: vi.fn(),
    error: mocks.showError,
  }),
}));

vi.mock("@/lib/AppearanceContext", () => ({
  useAppearance: () => ({
    fontTheme: "night-runner",
    setFontTheme: vi.fn(),
    attendanceVariant: "pill",
    setAttendanceVariant: vi.fn(),
    restTimerDuration: 180,
    setRestTimerDuration: vi.fn(),
    attendanceSuccessThreshold: 5,
    setAttendanceSuccessThreshold: vi.fn(),
  }),
}));

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...original,
    createFileRoute: () => (options: unknown) => ({ options }),
    useNavigate: () => vi.fn(),
  };
});

function stubNotificationApi(): void {
  const FakeNotification = Object.assign(
    function (this: unknown, title: string, options?: unknown) {
      mocks.constructed.push({ title, options });
    },
    {
      requestPermission: mocks.requestPermission,
    },
  );
  Object.defineProperty(FakeNotification, "permission", {
    get: () => mocks.permission,
  });
  vi.stubGlobal("Notification", FakeNotification);
  vi.stubGlobal("navigator", {
    ...window.navigator,
    serviceWorker: { getRegistration: async () => null },
  });
}

function renderSettings() {
  const Component = Route.options.component;
  if (typeof Component !== "function") {
    throw new Error("Settings route component is unavailable");
  }
  return render(<Component />);
}

beforeEach(() => {
  mocks.session = { session: { id: "session-1" } };
  mocks.profile = { notificationsEnabled: false };
  mocks.permission = "default";
  mocks.constructed = [];
  mocks.upsert.mockReset();
  mocks.showError.mockReset();
  mocks.requestPermission.mockReset();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("notifications settings", () => {
  it("requests permission and saves the preference when enabling notifications", async () => {
    stubNotificationApi();
    mocks.requestPermission.mockResolvedValue("granted");
    renderSettings();

    expect(
      screen.getByText("Off — tap to allow system notifications"),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("switch"));

    await waitFor(() =>
      expect(mocks.upsert).toHaveBeenCalledWith({
        updates: { notificationsEnabled: true },
      }),
    );
    expect(mocks.requestPermission).toHaveBeenCalledTimes(1);
  });

  it("explains denied permission and does not persist the preference", async () => {
    stubNotificationApi();
    mocks.requestPermission.mockResolvedValue("denied");
    renderSettings();

    fireEvent.click(screen.getByRole("switch"));

    await waitFor(() =>
      expect(
        screen.getByText(
          "Blocked — allow notifications in your device settings",
        ),
      ).toBeTruthy(),
    );
    expect(mocks.upsert).not.toHaveBeenCalled();
    expect(mocks.showError).toHaveBeenCalledWith(
      "Notifications are blocked. Allow them in your device settings, then try again.",
    );
  });

  it("explains a dismissed prompt and does not persist the preference", async () => {
    stubNotificationApi();
    mocks.requestPermission.mockResolvedValue("default");
    renderSettings();

    fireEvent.click(screen.getByRole("switch"));

    await waitFor(() =>
      expect(mocks.showError).toHaveBeenCalledWith(
        "Permission was dismissed. Tap again to allow notifications.",
      ),
    );
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("turns notifications off without touching permission", async () => {
    stubNotificationApi();
    mocks.profile = { notificationsEnabled: true };
    mocks.permission = "granted";
    mocks.upsert.mockResolvedValue({
      id: "profile-1",
      name: "User",
      email: "user@example.com",
      notificationsEnabled: false,
      weightUnit: "lbs",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    renderSettings();

    expect(
      screen.getByText("On — rest timer alerts appear on your device"),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("switch"));

    await waitFor(() =>
      expect(mocks.upsert).toHaveBeenCalledWith({
        updates: { notificationsEnabled: false },
      }),
    );
    expect(mocks.requestPermission).not.toHaveBeenCalled();
  });

  it("shows the unsupported description when the Notification API is missing", () => {
    renderSettings();

    expect(
      screen.getByText("Not supported on this browser"),
    ).toBeTruthy();
  });

  it("ignores a second toggle while a permission request is pending", async () => {
    stubNotificationApi();
    let resolveRequest: (value: NotificationPermissionState) => void = () => {};
    mocks.requestPermission.mockImplementation(
      () =>
        new Promise<NotificationPermissionState>((resolve) => {
          resolveRequest = resolve;
        }),
    );
    renderSettings();

    const toggle = screen.getByRole("switch");
    fireEvent.click(toggle);
    fireEvent.click(toggle);

    expect(mocks.requestPermission).toHaveBeenCalledTimes(1);

    resolveRequest("granted");
    await waitFor(() =>
      expect(mocks.upsert).toHaveBeenCalledWith({
        updates: { notificationsEnabled: true },
      }),
    );
  });

  it("disables the toggle when no profile is loaded", () => {
    stubNotificationApi();
    mocks.profile = null;
    renderSettings();

    expect(
      (screen.getByRole("switch") as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it("shows a sample notification from the test action when enabled", async () => {
    stubNotificationApi();
    mocks.profile = { notificationsEnabled: true };
    mocks.permission = "granted";
    renderSettings();

    const testRow = screen.getByRole("button", {
      name: /Send test notification/,
    }) as HTMLButtonElement;
    expect(testRow.disabled).toBe(false);

    fireEvent.click(testRow);

    await waitFor(() => expect(mocks.constructed).toHaveLength(1));
    expect(mocks.constructed[0]?.title).toBe("Nyx Fit");
  });

  it("keeps the test action disabled while notifications are off", () => {
    stubNotificationApi();
    renderSettings();

    const testRow = screen.getByRole("button", {
      name: /Send test notification/,
    }) as HTMLButtonElement;
    expect(testRow.disabled).toBe(true);
  });
});
