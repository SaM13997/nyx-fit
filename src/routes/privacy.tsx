import { createFileRoute } from "@tanstack/react-router";
import { LegalDocumentLayout } from "@/components/legal/LegalDocumentLayout";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Nyx Fitness" },
      {
        name: "description",
        content:
          "How Nyx Fitness collects, uses, and protects your workout and account data.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalDocumentLayout title="Privacy Policy" lastUpdated="June 24, 2026">
      <p>
        Nyx Fitness (&quot;Nyx Fit,&quot; &quot;we,&quot; &quot;us&quot;) helps
        hybrid athletes log workouts, track body metrics, and monitor progress.
        This policy explains what we collect, why we collect it, and the choices
        you have.
      </p>

      <section>
        <h2>Information we collect</h2>
        <ul>
          <li>
            <strong>Account data:</strong> name, email address, profile photo,
            and authentication identifiers when you sign in with Google or
            email.
          </li>
          <li>
            <strong>Fitness data:</strong> workouts, exercises, sets, reps,
            weights, rest timers, attendance streaks, and body-weight entries you
            choose to log.
          </li>
          <li>
            <strong>App preferences:</strong> appearance settings such as font
            theme, weekly goal, and rest-timer defaults stored on your account.
          </li>
          <li>
            <strong>Technical data:</strong> device type, browser, approximate
            usage events, and error logs needed to keep the service reliable and
            secure.
          </li>
        </ul>
      </section>

      <section>
        <h2>How we use information</h2>
        <ul>
          <li>Provide core features such as workout logging and progress views.</li>
          <li>Sync your data across devices when you are signed in.</li>
          <li>Improve performance, fix bugs, and protect against abuse.</li>
          <li>Respond to support requests you send us.</li>
        </ul>
        <p>
          We do not sell your personal information. We do not use your workout
          history for third-party advertising.
        </p>
      </section>

      <section>
        <h2>Service providers</h2>
        <p>
          We use trusted infrastructure partners to operate Nyx Fit, including
          hosting, authentication, and database services (for example Convex and
          Google sign-in). These providers process data on our behalf under
          contractual safeguards and only as needed to deliver the app.
        </p>
      </section>

      <section>
        <h2>Data retention</h2>
        <p>
          We keep your account and fitness data while your account is active. If
          you delete your account or request deletion, we remove or anonymize
          personal data within a reasonable period unless law requires longer
          retention.
        </p>
      </section>

      <section>
        <h2>Your choices and rights</h2>
        <ul>
          <li>Update profile details in Settings.</li>
          <li>Export or delete account data by contacting support.</li>
          <li>
            Where applicable, request access, correction, or deletion of personal
            data subject to local privacy laws.
          </li>
        </ul>
      </section>

      <section>
        <h2>Children</h2>
        <p>
          Nyx Fit is not directed to children under 13, and we do not knowingly
          collect personal information from children under 13.
        </p>
      </section>

      <section>
        <h2>Security</h2>
        <p>
          We use industry-standard safeguards such as encrypted transport (HTTPS)
          and access controls. No method of transmission or storage is 100%
          secure, so please use a strong, unique password for your sign-in
          provider.
        </p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>
          We may update this policy as the product evolves. Material changes will
          be reflected on this page with an updated date.
        </p>
      </section>
    </LegalDocumentLayout>
  );
}
