import { createFileRoute } from "@tanstack/react-router";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { parseRedirectParam } from "@/lib/redirect";

export const Route = createFileRoute("/onboarding")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: parseRedirectParam(search.redirect),
  }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const { redirect } = Route.useSearch();
  return <OnboardingFlow redirect={redirect} />;
}
