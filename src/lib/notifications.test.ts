import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getNotificationPermission,
  isNotificationSupported,
  requestNotificationPermission,
  showSystemNotification,
} from "./notifications";

type PermissionResult = "granted" | "denied" | "default";

type FakeRegistration = {
  active: unknown;
  showNotification: (title: string, options?: unknown) => Promise<void>;
};

const state = {
  permission: "default" as PermissionResult,
  requestResult: "granted" as PermissionResult,
  requestError: false,
  registration: null as FakeRegistration | null,
  constructed: [] as { title: string; options: unknown }[],
};

function installNotificationApi(): void {
  const FakeNotification = Object.assign(
    function (this: unknown, title: string, options?: unknown) {
      state.constructed.push({ title, options });
    },
    {
      requestPermission: async (): Promise<PermissionResult> => {
        if (state.requestError) {
          throw new Error("NotAllowedError");
        }
        return state.requestResult;
      },
    },
  );
  Object.defineProperty(FakeNotification, "permission", {
    get: () => state.permission,
  });
  vi.stubGlobal("Notification", FakeNotification);
  vi.stubGlobal("window", globalThis);
  vi.stubGlobal("navigator", {
    ...globalThis.navigator,
    serviceWorker: {
      getRegistration: async () => state.registration,
    },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  state.permission = "default";
  state.requestResult = "granted";
  state.requestError = false;
  state.registration = null;
  state.constructed = [];
});

describe("notification permission helpers", () => {
  it("reports unsupported when the Notification API is missing", () => {
    expect(isNotificationSupported()).toBe(false);
    expect(getNotificationPermission()).toBe("unsupported");
  });

  it("requests permission and maps the resolved browser value", async () => {
    installNotificationApi();
    state.requestResult = "granted";
    await expect(requestNotificationPermission()).resolves.toBe("granted");

    state.requestResult = "denied";
    await expect(requestNotificationPermission()).resolves.toBe("denied");
  });

  it("falls back to the stored permission when the request rejects, as iOS Safari does outside an installed PWA", async () => {
    installNotificationApi();
    state.requestError = true;
    state.permission = "denied";
    await expect(requestNotificationPermission()).resolves.toBe("denied");
  });
});

describe("showSystemNotification", () => {
  it("shows through the service worker when one is active", async () => {
    installNotificationApi();
    state.permission = "granted";
    const showNotification = vi.fn<(title: string, options?: unknown) => Promise<void>>(async () => {});
    state.registration = { active: {}, showNotification };

    const shown = await showSystemNotification("Rest over!", {
      body: "Time for your next set!",
    });

    expect(shown).toBe(true);
    expect(showNotification).toHaveBeenCalledWith(
      "Rest over!",
      expect.objectContaining({
        body: "Time for your next set!",
        icon: "/favicon.ico",
      }),
    );
    expect(state.constructed).toEqual([]);
  });

  it("returns false without constructing anything when permission is not granted", async () => {
    installNotificationApi();
    state.permission = "default";

    const shown = await showSystemNotification("Rest over!");

    expect(shown).toBe(false);
    expect(state.constructed).toEqual([]);
  });

  it("falls back to the Notification constructor when no service worker is active", async () => {
    installNotificationApi();
    state.permission = "granted";
    state.registration = null;

    const shown = await showSystemNotification("Rest over!", {
      body: "Time for your next set!",
    });

    expect(shown).toBe(true);
    expect(state.constructed[0]?.title).toBe("Rest over!");
    expect(state.constructed[0]?.options).toEqual(
      expect.objectContaining({
        body: "Time for your next set!",
        badge: "/favicon.ico",
      }),
    );
  });
});
