import { createFileRoute } from "@tanstack/react-router";
import { LegalDocumentLayout } from "@/components/legal/LegalDocumentLayout";
import { termsOfServiceSections } from "@/lib/legalContent";

export const Route = createFileRoute("/terms")({
  validateSearch: (search: Record<string, unknown>) => ({
    from: typeof search.from === "string" ? search.from : undefined,
  }),
  head: () => ({
    meta: [{ title: "Terms of Service — Nyx Fitness" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalDocumentLayout
      title="Terms of Service"
      sections={termsOfServiceSections}
    />
  );
}
