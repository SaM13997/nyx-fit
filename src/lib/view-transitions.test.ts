import { describe, expect, it, vi } from "vitest";
import { getRouteTransitionTypes, installViewTransitionGuard } from "./view-transitions";

const change = (from: string | undefined, to: string, pathChanged = true) => ({
  fromLocation: from === undefined ? undefined : { pathname: from },
  toLocation: { pathname: to },
  pathChanged,
});

describe("route transition types", () => {
  it("pushes into detail screens and pops back to tabs", () => {
    expect(getRouteTransitionTypes(change("/", "/workout/abc"))).toEqual(["push"]);
    expect(getRouteTransitionTypes(change("/workout/abc", "/workouts"))).toEqual(["pop"]);
    expect(getRouteTransitionTypes(change("/settings", "/settings/profile"))).toEqual(["push"]);
  });

  it("slides between tabs in tab-bar order", () => {
    expect(getRouteTransitionTypes(change("/", "/settings"))).toEqual(["tab-forward"]);
    expect(getRouteTransitionTypes(change("/settings", "/workouts"))).toEqual(["tab-back"]);
  });

  it("fades around auth and skips non-path changes", () => {
    expect(getRouteTransitionTypes(change("/onboarding", "/"))).toEqual(["fade"]);
    expect(getRouteTransitionTypes(change("/", "/", false))).toBe(false);
    expect(getRouteTransitionTypes(change(undefined, "/"))).toBe(false);
  });
});

describe("installViewTransitionGuard", () => {
  it("marks aborted transition promises as handled and installs once", async () => {
    const aborted = () => Promise.reject(new DOMException("aborted", "InvalidStateError"));
    const transition = {
      ready: aborted(),
      finished: aborted(),
      updateCallbackDone: Promise.resolve(),
      skipTransition: () => undefined,
      types: new Set<string>(),
    };
    const start = vi.fn((_update?: () => void) => transition);
    // src/lib tests run in node: a minimal document stands in for the browser.
    const fakeDocument = { startViewTransition: start };
    vi.stubGlobal("document", fakeDocument);
    const unhandled = vi.fn();
    process.on("unhandledRejection", unhandled);

    installViewTransitionGuard();
    const guarded = fakeDocument.startViewTransition;
    installViewTransitionGuard();
    expect(fakeDocument.startViewTransition).toBe(guarded);

    fakeDocument.startViewTransition(() => undefined);
    await new Promise((resolve) => setTimeout(resolve, 0));
    process.off("unhandledRejection", unhandled);

    vi.unstubAllGlobals();

    expect(start).toHaveBeenCalledTimes(1);
    expect(unhandled).not.toHaveBeenCalled();
  });
});
