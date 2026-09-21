import { createFileRoute, Link, useNavigate, useRouter, useSearch } from "@tanstack/react-router";
import { useEffect } from "react";
import { LoginForm } from "@/components/login-form";
import { authClient } from "@/lib/auth-client";
import { parseRedirectParam } from "@/lib/redirect";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: parseRedirectParam(search.redirect),
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const router = useRouter();
  const { redirect } = useSearch({ from: "/login" });
  const { data: sessionData, isPending: isAuthPending } =
    authClient.useSession();

  useEffect(() => {
    if (isAuthPending || !sessionData?.session) {
      return;
    }

    if (redirect) {
      router.history.push(redirect);
      return;
    }

    void navigate({ to: "/" });
  }, [isAuthPending, navigate, redirect, router.history, sessionData?.session]);

  if (isAuthPending || sessionData?.session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="animate-pulse text-zinc-400">Loading...</div>
      </div>
    );
  }

  const callbackURL = redirect
    ? `/login?redirect=${encodeURIComponent(redirect)}`
    : "/login";

  return (
    <div className="min-h-svh bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-zinc-900 to-black pointer-events-none" />
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-40 -left-20 w-64 h-64 bg-blue-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md py-8">
        <LoginForm callbackURL={callbackURL} />
        <Link to="/onboarding" search={{ redirect }} className="mt-6 flex min-h-11 items-center justify-center rounded-lg text-sm text-zinc-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 motion-reduce:transition-none">
          New here? Set up your profile
        </Link>
      </div>
    </div>
  );
}
