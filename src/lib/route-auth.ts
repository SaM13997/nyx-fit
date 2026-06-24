import { redirect } from "@tanstack/react-router";

type AuthRouteContext = {
  userId?: string;
};

type AuthRouteLocation = {
  href: string;
};

/** Redirect unauthenticated users to login, preserving the intended destination. */
export function requireAuth({
  context,
  location,
}: {
  context: AuthRouteContext;
  location: AuthRouteLocation;
}) {
  if (!context.userId) {
    throw redirect({
      to: "/login",
      search: { redirect: location.href },
    });
  }
}

/** Redirect authenticated users away from guest-only routes (e.g. login). */
export function redirectIfAuthenticated({
  context,
}: {
  context: AuthRouteContext;
}) {
  if (context.userId) {
    throw redirect({ to: "/" });
  }
}
