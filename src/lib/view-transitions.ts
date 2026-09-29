import { navItems } from "@/config/navigation";

// Shared by the active workout card and the workout screen's header card so
// the card morphs into the screen during the push.
export const ACTIVE_WORKOUT_TRANSITION_NAME = "active-workout";

export type RouteTransitionType = "tab-forward" | "tab-back" | "push" | "pop" | "fade";

type LocationChange = {
  fromLocation?: { pathname: string };
  toLocation: { pathname: string };
  pathChanged: boolean;
};

const FADE_ROUTES = new Set(["/login", "/onboarding"]);

const tabIndex = (pathname: string) =>
  navItems.findIndex((item) => item.href === pathname);

// Tabs sit at depth 0, everything reached from a tab is a pushed screen.
const depth = (pathname: string) => (tabIndex(pathname) >= 0 ? 0 : 1);

// Picks the route transition type from where navigation starts and ends, so
// drilling in pushes, going back pops, and tab switches slide by tab order.
export function getRouteTransitionTypes({
  fromLocation,
  toLocation,
  pathChanged,
}: LocationChange): RouteTransitionType[] | false {
  if (!pathChanged || !fromLocation) return false;

  const from = fromLocation.pathname;
  const to = toLocation.pathname;

  if (FADE_ROUTES.has(from) || FADE_ROUTES.has(to)) return ["fade"];

  const fromDepth = depth(from);
  const toDepth = depth(to);

  if (toDepth > fromDepth) return ["push"];
  if (toDepth < fromDepth) return ["pop"];
  if (toDepth === 0) {
    return [tabIndex(to) > tabIndex(from) ? "tab-forward" : "tab-back"];
  }

  return ["fade"];
}

// TanStack Router starts route view transitions but only awaits
// `updateCallbackDone`, leaving `ready`/`finished` unhandled. Browsers reject
// those when a transition is skipped or aborted (a newer navigation, tab
// hidden, viewport change), which surfaces as an unhandled
// "InvalidStateError: Transition was aborted". The DOM update itself still
// completes, so the rejections are expected: mark them handled.
export function installViewTransitionGuard() {
  if (typeof document === "undefined" || typeof document.startViewTransition !== "function") {
    return;
  }
  if (Object.prototype.hasOwnProperty.call(document.startViewTransition, "nyxGuarded")) return;
  const original = document.startViewTransition.bind(document);
  const guarded: typeof document.startViewTransition = (...args) => {
    const transition = original(...args);
    transition.ready.catch(() => undefined);
    transition.finished.catch(() => undefined);
    return transition;
  };
  Object.defineProperty(guarded, "nyxGuarded", { value: true });
  document.startViewTransition = guarded;
}
