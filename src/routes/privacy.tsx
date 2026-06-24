import { createFileRoute } from "@tanstack/react-router";
import { LegalDocumentLayout } from "@/components/legal/LegalDocumentLayout";
import { privacyPolicySections } from "@/lib/legalContent";

export const Route = createFileRoute("/privacy")({
  validateSearch: (search: Record<string, unknown>) => ({
    from: typeof search.from === "string" ? search.from : undefined,
  }),
  head: () => ({
    meta: [{ title: "Privacy Policy — Nyx Fitness" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalDocumentLayout
      title="Privacy Policy"
      sections={privacyPolicySections}
    />
  );
}
