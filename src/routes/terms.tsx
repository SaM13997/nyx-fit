import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";
import { termsSections } from "@/lib/legal-content";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [{ title: "Terms of Service — Nyx Fitness" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      summary="The rules and responsibilities that apply when you use Nyx Fitness."
      sections={termsSections}
    />
  );
}
