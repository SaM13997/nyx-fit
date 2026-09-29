import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ActionDock } from "./ActionDock";
import type { Workout } from "@/lib/types";

type DockMocks = {
  pathname: string;
  activeWorkout: Workout | null;
  latestWorkout: Workout | null;
  startWorkout: (input: { bodyPartWorkedOut?: string[] }) => Promise<Workout>;
};

const mocks = vi.hoisted(
  (): DockMocks => ({
    pathname: "/",
    activeWorkout: null,
    latestWorkout: null,
    startWorkout: async () => {
      throw new Error("not configured");
    },
  })
);

vi.mock("@tanstack/react-router", () => ({
  useRouterState: ({ select }: { select: (state: { location: { pathname: string } }) => string }) =>
    select({ location: { pathname: mocks.pathname } }),
  useNavigate: () => vi.fn(),
  Link: ({
    children,
    to,
    params,
    ...rest
  }: {
    children: ReactNode;
    to: string;
    params?: Record<string, string>;
    [key: string]: unknown;
  }) => (
    <a href={to.replace("$id", params?.id ?? "")} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("@/lib/auth-client", () => ({
  authClient: { useSession: () => ({ data: { session: { id: "s" } } }) },
}));
vi.mock("@/lib/toast", () => ({ useToast: () => ({ error: vi.fn() }) }));
vi.mock("@/lib/api/hooks", () => ({
  useActiveWorkout: () => ({ activeWorkout: mocks.activeWorkout, isLoading: false }),
  useHomeSnapshot: () => ({
    snapshot:
      mocks.latestWorkout === null
        ? null
        : { latestWorkout: { workout: mocks.latestWorkout, exercises: [] } },
  }),
  useStartWorkout: () => ({
    startWorkout: (input: { bodyPartWorkedOut?: string[] }) => mocks.startWorkout(input),
    isPending: false,
  }),
}));

const makeWorkout = (overrides: Partial<Workout>): Workout => ({
  id: "w1",
  date: "2026-09-16T10:00:00.000Z",
  duration: 0,
  exercises: [],
  revision: 1,
  ...overrides,
});

beforeEach(() => {
  mocks.pathname = "/";
  mocks.activeWorkout = null;
  mocks.latestWorkout = null;
  mocks.startWorkout = vi.fn(async () => makeWorkout({ id: "new" }));
  localStorage.clear();
});

afterEach(() => cleanup());

const openDrawer = async () => {
  render(<ActionDock />);
  fireEvent.click(await screen.findByRole("button", { name: /start workout/i }));
  return screen.findByRole("dialog");
};

// The idle Start button stays mounted (aria-hidden) while the drawer is open.
const idleStartButton = () => {
  const button = document.querySelector('button[aria-haspopup="dialog"]');
  if (!(button instanceof HTMLButtonElement)) throw new Error("Idle Start button not found");
  return button;
};

describe("ActionDock", () => {
  it("opens the start drawer and focuses its heading", async () => {
    const dialog = await openDrawer();
    const heading = screen.getByRole("heading", { name: "Start workout" });
    expect(dialog.getAttribute("aria-labelledby")).toBe(heading.id);
    expect(idleStartButton().getAttribute("aria-expanded")).toBe("true");
    await waitFor(() => expect(document.activeElement).toBe(heading));
  });

  it("hides the idle menu and start button from assistive tech while open", async () => {
    render(<ActionDock />);
    const menu = await screen.findByRole("button", { name: "Open menu" });
    const start = screen.getByRole("button", { name: /start workout/i });
    expect(menu.closest("[inert]")).toBeNull();

    fireEvent.click(start);
    await screen.findByRole("dialog");
    // Still mounted, so focus can return to them, but out of the tree and inert.
    expect(screen.queryByRole("button", { name: "Open menu" })).toBeNull();
    expect(screen.queryByRole("button", { name: /start workout/i })).toBeNull();
    expect(menu.closest("[aria-hidden='true']")).not.toBeNull();
    expect(menu.closest("[inert]")).not.toBeNull();
    expect(start.closest("[inert]")).not.toBeNull();
    // Only the drawer's own actions are reachable.
    expect(screen.getByRole("button", { name: "Cancel" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Start$/ })).toBeTruthy();

    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => expect(start.closest("[inert]")).toBeNull());
    expect(screen.getByRole("button", { name: "Open menu" })).toBeTruthy();
  });

  it("keeps Start disabled until a body part is picked", async () => {
    await openDrawer();
    const start = screen.getByRole("button", { name: /^Start/ });
    expect((start as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: /Chest/ }));
    expect((start as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(start);
    await waitFor(() =>
      expect(mocks.startWorkout).toHaveBeenCalledWith({ bodyPartWorkedOut: ["chest"] })
    );
  });

  it("repeats the last completed workout's body parts in one tap", async () => {
    mocks.latestWorkout = makeWorkout({
      id: "recent",
      date: "2026-09-10T10:00:00.000Z",
      bodyPartWorkedOut: ["back", "legs:Quads"],
    });
    await openDrawer();
    fireEvent.click(screen.getByRole("button", { name: /Repeat last/ }));
    await waitFor(() =>
      expect(mocks.startWorkout).toHaveBeenCalledWith({ bodyPartWorkedOut: ["back", "legs:Quads"] })
    );
  });

  it("hides the repeat row when there is nothing to repeat", async () => {
    await openDrawer();
    expect(screen.queryByRole("button", { name: /Repeat last/ })).toBeNull();
  });

  it("closes on Escape, returns focus to Start and removes the drawer", async () => {
    await openDrawer();
    fireEvent.keyDown(window, { key: "Escape" });
    // The dialog is gone at once; the options fade out, then the body unmounts.
    expect(screen.queryByRole("dialog")).toBeNull();
    const start = screen.getByRole("button", { name: /start workout/i });
    expect(start.getAttribute("aria-expanded")).toBe("false");
    await waitFor(() => expect(document.activeElement).toBe(start));
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Start workout" })).toBeNull());
    expect(screen.queryByRole("button", { name: "Cancel" })).toBeNull();
  });

  it("closes with Cancel and can be reopened with a fresh selection", async () => {
    await openDrawer();
    fireEvent.click(screen.getByRole("button", { name: /Chest/ }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Start workout" })).toBeNull());

    fireEvent.click(screen.getByRole("button", { name: /start workout/i }));
    await screen.findByRole("dialog");
    expect(screen.getByRole("button", { name: /Chest/ }).getAttribute("aria-pressed")).toBe("false");
  });

  it("can be reopened while it is still closing", async () => {
    await openDrawer();
    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: /start workout/i }));
    await screen.findByRole("dialog");
    // The pending close never lands on a drawer the user reopened.
    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Start workout" })).toBeTruthy();
  });

  it("shows a resume link with the timer when a workout is active", async () => {
    mocks.activeWorkout = makeWorkout({
      id: "active",
      isActive: true,
      startTime: new Date(Date.now() - 65_000).toISOString(),
      bodyPartWorkedOut: ["chest"],
    });
    render(<ActionDock />);
    const resume = await screen.findByRole("link", { name: /Resume workout/ });
    expect(resume.getAttribute("href")).toBe("/workout/active");
    expect(resume.textContent).toMatch(/01:0\d/);
    expect(screen.queryByRole("button", { name: /start workout/i })).toBeNull();
  });

  it("hides the primary action inside a workout but keeps the menu", async () => {
    mocks.pathname = "/workout/abc";
    render(<ActionDock />);
    expect(await screen.findByRole("button", { name: "Open menu" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /start workout/i })).toBeNull();
  });

  it("opens the menu upward, marks the current route and returns focus on Escape", async () => {
    mocks.pathname = "/stats";
    render(<ActionDock />);
    const pill = await screen.findByRole("button", { name: "Open menu" });
    fireEvent.click(pill);
    const current = await screen.findByRole("link", { name: "Stats" });
    expect(current.getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "Home" }).getAttribute("aria-current")).toBeNull();
    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("link", { name: "Stats" })).toBeNull());
    expect(document.activeElement).toBe(pill);
  });
});
