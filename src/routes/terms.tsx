import { createFileRoute } from "@tanstack/react-router";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

const EFFECTIVE_DATE = "June 24, 2026";
const CONTACT_EMAIL = "legal@nyxfitness.app";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () => ({
    meta: [
      { title: "Terms of Service — Nyx Fitness" },
      {
        name: "description",
        content:
          "Terms governing your use of the Nyx Fitness workout tracking app.",
      },
    ],
  }),
});

function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      effectiveDate={EFFECTIVE_DATE}
      intro={
        <p>
          These Terms of Service (&quot;Terms&quot;) govern your access to and use
          of Nyx Fitness (&quot;Nyx Fit,&quot; &quot;we,&quot; &quot;us&quot;).
          By creating an account, signing in, installing the app, or otherwise
          using the Service, you agree to these Terms. If you do not agree, do not
          use the Service.
        </p>
      }
      sections={[
        {
          title: "Eligibility",
          body: (
            <p>
              You must be at least 13 years old (or the minimum age required in
              your jurisdiction) and able to form a binding contract. If you use
              the Service on behalf of an organization, you represent that you
              have authority to bind that organization.
            </p>
          ),
        },
        {
          title: "Your account",
          body: (
            <>
              <p>
                You are responsible for maintaining the confidentiality of your
                sign-in method and for activity under your account. Notify us
                promptly if you suspect unauthorized access.
              </p>
              <p>
                You agree to provide accurate profile information and to keep it
                reasonably up to date.
              </p>
            </>
          ),
        },
        {
          title: "Acceptable use",
          body: (
            <>
              <p>You agree not to:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>Use the Service for unlawful, harmful, or abusive purposes</li>
                <li>Attempt to access another user&apos;s data without permission</li>
                <li>Interfere with or disrupt the Service or its infrastructure</li>
                <li>Reverse engineer or scrape the Service except as permitted by law</li>
                <li>Upload malware or content that infringes others&apos; rights</li>
              </ul>
            </>
          ),
        },
        {
          title: "Health and fitness disclaimer",
          body: (
            <p>
              Nyx Fit is a fitness tracking tool, not medical advice. The Service
              does not provide diagnosis, treatment, or professional coaching.
              Consult a qualified health professional before starting or changing
              any exercise program. You assume all risks associated with physical
              activity and use of the Service.
            </p>
          ),
        },
        {
          title: "Your content",
          body: (
            <p>
              You retain ownership of the workout logs, metrics, and other content
              you submit. You grant us a limited license to host, process, display,
              and back up that content solely to operate and improve the Service.
            </p>
          ),
        },
        {
          title: "Intellectual property",
          body: (
            <p>
              The Service, including its design, branding, software, and
              documentation, is owned by Nyx Fit and its licensors and is
              protected by applicable intellectual property laws. These Terms do
              not grant you any rights to our trademarks or branding except as
              needed to use the Service.
            </p>
          ),
        },
        {
          title: "Availability and changes",
          body: (
            <p>
              We may modify, suspend, or discontinue features at any time. We
              strive for high availability but do not guarantee uninterrupted
              access. We may update these Terms; continued use after changes take
              effect constitutes acceptance of the revised Terms.
            </p>
          ),
        },
        {
          title: "Termination",
          body: (
            <p>
              You may stop using the Service at any time and may request account
              deletion. We may suspend or terminate access if you violate these
              Terms or if necessary to protect users, the Service, or our legal
              obligations.
            </p>
          ),
        },
        {
          title: "Disclaimers",
          body: (
            <p>
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS
              AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR
              IMPLIED, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS
              FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
          ),
        },
        {
          title: "Limitation of liability",
          body: (
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, NYX FIT AND ITS AFFILIATES
              WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
              CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF DATA, PROFITS, OR
              GOODWILL, ARISING FROM YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY
              FOR ANY CLAIM RELATING TO THE SERVICE IS LIMITED TO THE GREATER OF
              USD $100 OR THE AMOUNT YOU PAID US IN THE TWELVE MONTHS BEFORE THE
              CLAIM AROSE.
            </p>
          ),
        },
        {
          title: "Governing law",
          body: (
            <p>
              These Terms are governed by the laws of the State of Delaware,
              United States, without regard to conflict-of-law principles, except
              where mandatory local consumer protections apply.
            </p>
          ),
        },
        {
          title: "Contact",
          body: (
            <p>
              Questions about these Terms? Email{" "}
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
