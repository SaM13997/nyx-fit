import { createFileRoute } from "@tanstack/react-router";
import { LegalDocumentLayout } from "@/components/legal/LegalDocumentLayout";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Nyx Fitness" },
      {
        name: "description",
        content:
          "Terms governing your use of the Nyx Fitness workout tracking application.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalDocumentLayout title="Terms of Service" lastUpdated="June 24, 2026">
      <p>
        These Terms of Service (&quot;Terms&quot;) govern your access to and use
        of Nyx Fitness (&quot;Nyx Fit,&quot; &quot;the app,&quot; &quot;we,&quot;
        &quot;us&quot;). By creating an account or using the app, you agree to
        these Terms.
      </p>

      <section>
        <h2>Eligibility</h2>
        <p>
          You must be at least 13 years old and able to form a binding contract
          in your jurisdiction. If you use the app on behalf of an organization,
          you represent that you have authority to bind that organization.
        </p>
      </section>

      <section>
        <h2>Your account</h2>
        <ul>
          <li>You are responsible for activity under your account.</li>
          <li>Keep your sign-in credentials secure through your auth provider.</li>
          <li>Provide accurate profile information and update it when it changes.</li>
        </ul>
      </section>

      <section>
        <h2>Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the app for unlawful, harmful, or abusive purposes.</li>
          <li>Attempt to access another user&apos;s data without permission.</li>
          <li>Reverse engineer, scrape, or overload our systems.</li>
          <li>Upload malware or interfere with app security or availability.</li>
        </ul>
      </section>

      <section>
        <h2>Health and fitness disclaimer</h2>
        <p>
          Nyx Fit is a training log and progress tool, not medical advice. Consult
          a qualified professional before starting or changing any exercise
          program. You assume all risk from physical activity you perform while
          using the app.
        </p>
      </section>

      <section>
        <h2>Your content</h2>
        <p>
          You retain ownership of workout and profile data you submit. You grant us
          a limited license to host, process, and display that data solely to
          operate and improve the service for you.
        </p>
      </section>

      <section>
        <h2>Service availability</h2>
        <p>
          We strive for high availability but do not guarantee uninterrupted
          access. Features may change, and we may suspend accounts that violate
          these Terms or pose a security risk.
        </p>
      </section>

      <section>
        <h2>Termination</h2>
        <p>
          You may stop using the app at any time. We may terminate or suspend
          access if you breach these Terms. Upon termination, your right to use
          the app ends, subject to applicable data retention described in our
          Privacy Policy.
        </p>
      </section>

      <section>
        <h2>Disclaimer of warranties</h2>
        <p>
          The app is provided &quot;as is&quot; without warranties of any kind,
          whether express or implied, including merchantability, fitness for a
          particular purpose, and non-infringement.
        </p>
      </section>

      <section>
        <h2>Limitation of liability</h2>
        <p>
          To the fullest extent permitted by law, Nyx Fit and its operators will
          not be liable for indirect, incidental, special, consequential, or
          punitive damages, or any loss of profits, data, or goodwill arising
          from your use of the app.
        </p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>
          We may update these Terms from time to time. Continued use after changes
          become effective constitutes acceptance of the revised Terms.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          For questions about these Terms, email{" "}
          <a
            href="mailto:support@nyxfit.app"
            className="text-purple-400 underline-offset-2 hover:underline"
          >
            support@nyxfit.app
          </a>
          .
        </p>
      </section>
    </LegalDocumentLayout>
  );
}
