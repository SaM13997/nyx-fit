import { createFileRoute } from "@tanstack/react-router";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

export const Route = createFileRoute("/onboarding")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect:
      typeof search.redirect === "string" &&
      search.redirect.startsWith("/") &&
      !search.redirect.startsWith("//") &&
      !/[\\\u0000-\u0020]/.test(search.redirect)
        ? search.redirect
        : undefined,
  }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const { redirect } = Route.useSearch();
  return <OnboardingFlow redirect={redirect} />;
}
