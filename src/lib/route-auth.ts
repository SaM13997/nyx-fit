import { redirect } from "@tanstack/react-router";

type AuthRouteContext = {
  userId?: string;
};

export function requireAuth({
  context,
  location,
}: {
  context: AuthRouteContext;
  location: { href: string };
}) {
  if (!context.userId) {
    throw redirect({
      to: "/login",
      search: { redirect: location.href },
    });
  }
}

export function redirectIfAuthenticated({
  context,
  search,
}: {
  context: AuthRouteContext;
  search: { redirect?: string };
}) {
  if (!context.userId) {
    return;
  }

  const redirectTo =
    typeof search.redirect === "string" && search.redirect.length > 0
      ? search.redirect
      : "/";

  throw redirect({ href: redirectTo });
}
