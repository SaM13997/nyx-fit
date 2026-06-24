import { createFileRoute } from "@tanstack/react-router";
import {
  LegalDocumentPage,
  LegalLink,
  LegalSection,
} from "@/components/legal/LegalDocumentPage";
import { LEGAL_CONTACT_EMAIL, LEGAL_LAST_UPDATED } from "@/lib/legal";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | Nyx Fitness" },
      {
        name: "description",
        content:
          "Privacy Policy for Nyx Fitness — how we collect, use, and protect your workout and account data.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalDocumentPage title="Privacy Policy" lastUpdated={LEGAL_LAST_UPDATED}>
      <LegalSection title="Overview">
        <p>
          Nyx Fitness (&quot;Nyx Fit&quot;, &quot;we&quot;, &quot;us&quot;) helps
          hybrid athletes log workouts, track body weight, and review progress.
          This Privacy Policy explains what information we collect, why we
          collect it, and the choices you have.
        </p>
      </LegalSection>

      <LegalSection title="Information we collect">
        <p>
          <strong className="text-white">Account information.</strong> When you
          sign in (including with Google), we receive identifiers and profile
          details such as your name and email address through our
          authentication provider.
        </p>
        <p>
          <strong className="text-white">Fitness data you provide.</strong> This
          includes workouts, exercises, sets, reps, weights, session notes, body
          weight entries, goals, and optional profile details such as fitness
          level or profile photo.
        </p>
        <p>
          <strong className="text-white">App preferences.</strong> We store
          settings such as appearance theme, rest timer duration, and unit
          preferences locally and/or in your account so they sync across devices.
        </p>
        <p>
          <strong className="text-white">Device and usage data.</strong> When
          you install or use the app, basic technical information (such as
          browser type, app version, and crash logs) may be processed by our
          hosting providers to keep the service secure and reliable.
        </p>
      </LegalSection>

      <LegalSection title="How we use information">
        <ul className="list-disc space-y-2 pl-5">
          <li>Provide core features such as workout logging and progress views</li>
          <li>Authenticate you and keep your account secure</li>
          <li>Sync your data across sessions and devices</li>
          <li>Improve performance, reliability, and usability</li>
          <li>Respond to support requests and legal obligations</li>
        </ul>
        <p>
          We do not sell your personal information. We do not use your workout
          data for third-party advertising.
        </p>
      </LegalSection>

      <LegalSection title="How information is stored">
        <p>
          Account and fitness data are stored in Convex, our backend database
          provider. Authentication is handled through Better Auth and, when
          enabled, Google Sign-In. Data is transmitted over encrypted
          connections (HTTPS).
        </p>
        <p>
          Some preferences (for example install prompt dismissal) may be stored
          in your browser&apos;s local storage on your device.
        </p>
      </LegalSection>

      <LegalSection title="Sharing">
        <p>
          We share information only with service providers that help us operate
          Nyx Fit (such as hosting, authentication, and analytics infrastructure)
          under contracts that require them to protect your data. We may disclose
          information if required by law or to protect the rights, safety, and
          security of our users and the service.
        </p>
      </LegalSection>

      <LegalSection title="Your choices">
        <ul className="list-disc space-y-2 pl-5">
          <li>Update profile details in Settings</li>
          <li>Sign out at any time from Settings</li>
          <li>
            Request account or data deletion by contacting{" "}
            <a
              href={`mailto:${LEGAL_CONTACT_EMAIL}`}
              className="font-medium text-orange-400 underline decoration-orange-400/40 underline-offset-4"
            >
              {LEGAL_CONTACT_EMAIL}
            </a>
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Children">
        <p>
          Nyx Fit is not directed to children under 13 (or the minimum age
          required in your region). We do not knowingly collect personal
          information from children.
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          We may update this Privacy Policy from time to time. Material changes
          will be reflected by updating the &quot;Last updated&quot; date above.
          Continued use of Nyx Fit after changes become effective constitutes
          acceptance of the updated policy.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions about this Privacy Policy? Email{" "}
          <a
            href={`mailto:${LEGAL_CONTACT_EMAIL}`}
            className="font-medium text-orange-400 underline decoration-orange-400/40 underline-offset-4"
          >
            {LEGAL_CONTACT_EMAIL}
          </a>
          . See also our <LegalLink to="/terms">Terms of Service</LegalLink>.
        </p>
      </LegalSection>
    </LegalDocumentPage>
  );
}
