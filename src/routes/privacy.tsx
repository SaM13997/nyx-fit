import { createFileRoute } from "@tanstack/react-router";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

const EFFECTIVE_DATE = "June 24, 2026";
const CONTACT_EMAIL = "privacy@nyxfitness.app";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
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
});

function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      effectiveDate={EFFECTIVE_DATE}
      intro={
        <p>
          Nyx Fitness (&quot;Nyx Fit,&quot; &quot;we,&quot; &quot;us&quot;) helps
          hybrid athletes log workouts, track body metrics, and monitor progress.
          This Privacy Policy explains what information we collect, how we use it,
          and the choices you have when you use our website, progressive web app,
          and related services (collectively, the &quot;Service&quot;).
        </p>
      }
      sections={[
        {
          title: "Information we collect",
          body: (
            <>
              <p>
                <strong className="text-zinc-100">Account information.</strong>{" "}
                When you sign in with Google or another supported provider, we
                receive identifiers such as your name, email address, and profile
                image as made available by that provider.
              </p>
              <p>
                <strong className="text-zinc-100">Fitness data you provide.</strong>{" "}
                This includes workouts, exercises, sets, reps, weights, rest
                timer preferences, attendance goals, body-weight entries, profile
                details, and appearance settings you save in the app.
              </p>
              <p>
                <strong className="text-zinc-100">Device and usage data.</strong>{" "}
                We collect technical information needed to operate the Service,
                such as browser type, device type, app install state, and basic
                diagnostic logs. We do not sell your personal information.
              </p>
            </>
          ),
        },
        {
          title: "How we use information",
          body: (
            <>
              <p>We use your information to:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>Authenticate you and maintain your account</li>
                <li>Store and display your workouts, weights, and progress</li>
                <li>Sync your data across devices in real time</li>
                <li>Improve reliability, security, and product performance</li>
                <li>Respond to support requests and legal obligations</li>
              </ul>
            </>
          ),
        },
        {
          title: "How we share information",
          body: (
            <>
              <p>
                We use service providers that process data on our behalf to run
                the Service, including:
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong className="text-zinc-100">Convex</strong> for secure
                  cloud database hosting and real-time sync
                </li>
                <li>
                  <strong className="text-zinc-100">Google</strong> when you
                  choose Google sign-in
                </li>
                <li>
                  Hosting and infrastructure providers that deliver the app to
                  your device
                </li>
              </ul>
              <p>
                We may also disclose information if required by law, to protect
                users and the Service, or in connection with a merger or sale of
                assets, subject to appropriate safeguards.
              </p>
            </>
          ),
        },
        {
          title: "Data retention and deletion",
          body: (
            <p>
              We retain your account and fitness data while your account is
              active. You may request account deletion from Settings or by
              contacting us. When you delete your account, we delete or
              anonymize associated personal data within a reasonable period,
              except where retention is required by law or for legitimate security
              purposes.
            </p>
          ),
        },
        {
          title: "Your choices and rights",
          body: (
            <>
              <p>
                Depending on where you live, you may have rights to access,
                correct, export, or delete your personal information, or to object
                to certain processing. Contact us at{" "}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-orange-400 underline-offset-2 hover:underline"
                >
                  {CONTACT_EMAIL}
                </a>{" "}
                to exercise these rights.
              </p>
              <p>
                You can sign out at any time and uninstall the app from your
                device. Local install preferences may remain on your device until
                you clear them.
              </p>
            </>
          ),
        },
        {
          title: "Security",
          body: (
            <p>
              We use industry-standard safeguards such as encrypted transport
              (HTTPS), authenticated access controls, and provider security
              practices. No method of transmission or storage is completely
              secure, and we cannot guarantee absolute security.
            </p>
          ),
        },
        {
          title: "Children",
          body: (
            <p>
              The Service is not directed to children under 13 (or the minimum age
              required in your jurisdiction). We do not knowingly collect
              personal information from children. If you believe a child has
              provided us data, contact us and we will take appropriate steps to
              delete it.
            </p>
          ),
        },
        {
          title: "International users",
          body: (
            <p>
              Your information may be processed in countries other than where you
              live, including the United States, where our infrastructure
              providers operate. We take steps designed to protect your
              information consistent with this policy and applicable law.
            </p>
          ),
        },
        {
          title: "Changes to this policy",
          body: (
            <p>
              We may update this Privacy Policy from time to time. We will post
              the revised policy in the app and update the effective date above.
              Material changes will be communicated where required by law.
            </p>
          ),
        },
        {
          title: "Contact us",
          body: (
            <p>
              Questions about this Privacy Policy? Email{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-orange-400 underline-offset-2 hover:underline"
              >
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          ),
        },
      ]}
    />
  );
}
