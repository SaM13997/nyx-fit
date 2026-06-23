import { createFileRoute } from "@tanstack/react-router";
import {
  LegalDocumentPage,
  LegalLink,
  LegalSection,
} from "@/components/legal/LegalDocumentPage";
import { LEGAL_CONTACT_EMAIL, LEGAL_LAST_UPDATED } from "@/lib/legal";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service | Nyx Fitness" },
      {
        name: "description",
        content:
          "Terms of Service for Nyx Fitness — rules for using the workout tracking app.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalDocumentPage title="Terms of Service" lastUpdated={LEGAL_LAST_UPDATED}>
      <LegalSection title="Agreement">
        <p>
          These Terms of Service (&quot;Terms&quot;) govern your access to and
          use of Nyx Fitness (&quot;Nyx Fit&quot;, &quot;the app&quot;). By
          creating an account, signing in, installing the app, or using any part
          of the service, you agree to these Terms and our{" "}
          <LegalLink to="/privacy">Privacy Policy</LegalLink>.
        </p>
      </LegalSection>

      <LegalSection title="Eligibility">
        <p>
          You must be at least 13 years old (or the minimum age required in your
          jurisdiction) and able to form a binding contract. If you use Nyx Fit
          on behalf of an organization, you represent that you have authority to
          bind that organization to these Terms.
        </p>
      </LegalSection>

      <LegalSection title="Your account">
        <p>
          You are responsible for maintaining the confidentiality of your sign-in
          method and for activity that occurs under your account. Notify us
          promptly at{" "}
          <a
            href={`mailto:${LEGAL_CONTACT_EMAIL}`}
            className="font-medium text-orange-400 underline decoration-orange-400/40 underline-offset-4"
          >
            {LEGAL_CONTACT_EMAIL}
          </a>{" "}
          if you suspect unauthorized access.
        </p>
      </LegalSection>

      <LegalSection title="Acceptable use">
        <p>You agree not to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Use the app for unlawful, harmful, or abusive purposes</li>
          <li>Attempt to access another user&apos;s data without permission</li>
          <li>Reverse engineer, scrape, or disrupt the service or its infrastructure</li>
          <li>Upload malware or content that infringes others&apos; rights</li>
        </ul>
      </LegalSection>

      <LegalSection title="Health disclaimer">
        <p>
          Nyx Fit provides fitness tracking tools for informational purposes
          only. It is not medical advice and is not a substitute for professional
          healthcare. Consult a qualified professional before starting or changing
          any exercise program. You assume all risks associated with physical
          activity you choose to perform.
        </p>
      </LegalSection>

      <LegalSection title="Your content">
        <p>
          You retain ownership of workout logs, notes, and other content you
          submit. You grant us a limited license to host, process, and display
          that content solely to operate and improve the service for you.
        </p>
      </LegalSection>

      <LegalSection title="Service availability">
        <p>
          We strive to keep Nyx Fit available and reliable, but the service is
          provided on an &quot;as is&quot; and &quot;as available&quot; basis. We
          may modify, suspend, or discontinue features with reasonable notice
          where practicable.
        </p>
      </LegalSection>

      <LegalSection title="Limitation of liability">
        <p>
          To the fullest extent permitted by law, Nyx Fit and its operators will
          not be liable for indirect, incidental, special, consequential, or
          punitive damages, or for loss of data, profits, or goodwill arising from
          your use of the app. Our total liability for any claim related to the
          service is limited to the greater of (a) amounts you paid us in the
          twelve months before the claim or (b) USD $100.
        </p>
      </LegalSection>

      <LegalSection title="Termination">
        <p>
          You may stop using Nyx Fit at any time. We may suspend or terminate
          access if you violate these Terms or if required for security or legal
          reasons. Sections that by nature should survive termination (including
          disclaimers and limitations of liability) will continue to apply.
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          We may update these Terms from time to time. If we make material
          changes, we will update the &quot;Last updated&quot; date above.
          Continued use after changes take effect constitutes acceptance of the
          revised Terms.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions about these Terms? Email{" "}
          <a
            href={`mailto:${LEGAL_CONTACT_EMAIL}`}
            className="font-medium text-orange-400 underline decoration-orange-400/40 underline-offset-4"
          >
            {LEGAL_CONTACT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>
    </LegalDocumentPage>
  );
}
