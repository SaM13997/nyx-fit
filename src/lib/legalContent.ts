export const LEGAL_LAST_UPDATED = "June 24, 2026";

export const LEGAL_CONTACT_EMAIL = "privacy@nyxfit.app";

export type LegalSection = {
  title: string;
  paragraphs: string[];
};

export const privacyPolicySections: LegalSection[] = [
  {
    title: "Introduction",
    paragraphs: [
      "Nyx Fitness (“Nyx Fit,” “we,” “us”) helps hybrid athletes log workouts, track body metrics, and monitor progress. This Privacy Policy explains what information we collect, how we use it, and the choices you have when you use our web app and installed PWA.",
    ],
  },
  {
    title: "Information we collect",
    paragraphs: [
      "Account information: When you sign in with Google or email, we receive your name, email address, and profile image provided by your identity provider.",
      "Fitness data you create: Workout logs (exercises, sets, reps, weights, duration), body-weight entries, profile details (such as display name, goals, and preferences), and app settings you save in Nyx Fit.",
      "Technical data: Device type, browser, approximate usage timestamps, and diagnostic logs needed to operate and secure the service. We do not sell your personal information.",
    ],
  },
  {
    title: "How we use information",
    paragraphs: [
      "We use your information to authenticate you, sync your data across devices, display progress and charts, improve reliability, and respond to support requests.",
      "We may use aggregated, de-identified statistics to understand product usage. Aggregated data cannot reasonably identify you.",
    ],
  },
  {
    title: "How we share information",
    paragraphs: [
      "We use service providers to host and operate Nyx Fit, including Convex (database and backend) and Google (sign-in). These providers process data on our behalf under contractual safeguards.",
      "We may disclose information if required by law, to protect users and the service, or in connection with a merger or acquisition with notice where required.",
      "We do not share your workout or body-metric data with advertisers.",
    ],
  },
  {
    title: "Data retention and security",
    paragraphs: [
      "We retain your account and fitness data while your account is active. You may request deletion of your account and associated data by contacting us.",
      "We apply industry-standard technical and organizational measures, including encrypted transport (HTTPS) and access controls. No method of transmission or storage is 100% secure.",
    ],
  },
  {
    title: "Your rights and choices",
    paragraphs: [
      "Depending on where you live, you may have rights to access, correct, export, or delete personal data, or to object to certain processing.",
      "You can update profile information in Settings. To exercise privacy rights, email us at the address below.",
    ],
  },
  {
    title: "Children",
    paragraphs: [
      "Nyx Fit is not directed to children under 13 (or the minimum age required in your jurisdiction). We do not knowingly collect personal information from children.",
    ],
  },
  {
    title: "International users",
    paragraphs: [
      "Your information may be processed in countries other than where you live. We take steps designed to protect your information consistent with this policy.",
    ],
  },
  {
    title: "Changes and contact",
    paragraphs: [
      "We may update this policy from time to time. We will post the revised date at the top of this page. Continued use after changes means you accept the updated policy.",
      `Questions or requests: ${LEGAL_CONTACT_EMAIL}`,
    ],
  },
];

export const termsOfServiceSections: LegalSection[] = [
  {
    title: "Agreement",
    paragraphs: [
      "By accessing or using Nyx Fitness (“Nyx Fit”), you agree to these Terms of Service. If you do not agree, do not use the service.",
    ],
  },
  {
    title: "The service",
    paragraphs: [
      "Nyx Fit provides tools to log workouts, track body metrics, and review training progress. Features may change as we improve the product.",
      "You are responsible for maintaining the confidentiality of your account and for activity under your account.",
    ],
  },
  {
    title: "Health and safety disclaimer",
    paragraphs: [
      "Nyx Fit is for general fitness tracking only. It is not medical advice and does not replace consultation with a qualified health professional.",
      "Consult a physician before starting any exercise program. You assume all risks associated with physical activity and use of the app.",
    ],
  },
  {
    title: "Acceptable use",
    paragraphs: [
      "You agree not to misuse the service, attempt unauthorized access, interfere with other users, upload unlawful content, or reverse engineer the app except where permitted by law.",
      "We may suspend or terminate accounts that violate these terms or create risk for the service or other users.",
    ],
  },
  {
    title: "Your content",
    paragraphs: [
      "You retain ownership of workout and profile data you submit. You grant us a limited license to host, process, and display that data solely to operate and improve Nyx Fit.",
    ],
  },
  {
    title: "Intellectual property",
    paragraphs: [
      "Nyx Fit, including its design, branding, and software, is owned by us or our licensors and protected by applicable intellectual property laws.",
    ],
  },
  {
    title: "Disclaimer of warranties",
    paragraphs: [
      "The service is provided “as is” and “as available” without warranties of any kind, whether express or implied, including merchantability, fitness for a particular purpose, and non-infringement.",
    ],
  },
  {
    title: "Limitation of liability",
    paragraphs: [
      "To the fullest extent permitted by law, Nyx Fit and its operators will not be liable for indirect, incidental, special, consequential, or punitive damages, or any loss of data, profits, or goodwill arising from your use of the service.",
    ],
  },
  {
    title: "Termination",
    paragraphs: [
      "You may stop using Nyx Fit at any time. We may suspend or terminate access if you breach these terms or if we discontinue the service with reasonable notice where practicable.",
    ],
  },
  {
    title: "Governing law and changes",
    paragraphs: [
      "These terms are governed by the laws applicable where Nyx Fit is operated, without regard to conflict-of-law rules.",
      "We may update these terms. Material changes will be reflected on this page with an updated date. Continued use after changes constitutes acceptance.",
      `Contact: ${LEGAL_CONTACT_EMAIL}`,
    ],
  },
];
