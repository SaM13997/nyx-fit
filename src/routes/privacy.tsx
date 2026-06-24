import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";
import { privacySections } from "@/lib/legal-content";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [{ title: "Privacy Policy — Nyx Fitness" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      summary="How Nyx Fitness collects, uses, and protects your account and training data."
      sections={privacySections}
    />
  );
}
