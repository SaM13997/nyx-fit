export type LegalSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export const LEGAL_LAST_UPDATED = "June 24, 2026";
export const LEGAL_CONTACT_EMAIL = "support@nyxfit.app";

export const privacySections: LegalSection[] = [
  {
    id: "introduction",
    title: "Introduction",
    paragraphs: [
      "Nyx Fitness (\"Nyx Fit\", \"we\", \"us\", or \"our\") provides a workout and body-metrics tracking application for hybrid athletes. This Privacy Policy explains what information we collect, how we use it, and the choices you have when you use our website, progressive web app, and related services (collectively, the \"Service\").",
      "By creating an account or using the Service, you agree to this Privacy Policy.",
    ],
  },
  {
    id: "information-we-collect",
    title: "Information We Collect",
    paragraphs: ["We collect information in the following categories:"],
    bullets: [
      "Account information such as your name, email address, profile photo, and authentication identifiers when you sign in with email or Google.",
      "Fitness data you choose to log, including workouts, exercises, sets, reps, weights, rest-timer preferences, attendance goals, and body-weight entries.",
      "App preferences such as appearance settings stored on your device or synced with your account.",
      "Technical data such as device type, browser, approximate usage events, and cookies or local storage needed to keep you signed in and operate the Service.",
    ],
  },
  {
    id: "how-we-use",
    title: "How We Use Information",
    paragraphs: ["We use the information we collect to:"],
    bullets: [
      "Provide, maintain, and improve the Service, including syncing your data across devices.",
      "Authenticate you and protect account security.",
      "Display your training history, progress trends, and personalized settings.",
      "Respond to support requests and communicate important service updates.",
      "Comply with legal obligations and enforce our Terms of Service.",
    ],
  },
  {
    id: "sharing",
    title: "How We Share Information",
    paragraphs: [
      "We do not sell your personal information. We share information only with service providers that help us operate the Service, such as hosting, authentication, database, and analytics providers. These providers may process data on our behalf under contractual obligations to protect it.",
      "We may disclose information if required by law, to protect the rights and safety of users, or in connection with a merger, acquisition, or sale of assets with appropriate notice where required.",
    ],
  },
  {
    id: "retention",
    title: "Data Retention",
    paragraphs: [
      "We retain account and fitness data for as long as your account is active or as needed to provide the Service. If you delete your account, we delete or anonymize associated personal data within a reasonable period, except where retention is required for legal, security, or fraud-prevention purposes.",
    ],
  },
  {
    id: "security",
    title: "Security",
    paragraphs: [
      "We use industry-standard safeguards such as encrypted transport (HTTPS), access controls, and authenticated backend services. No method of transmission or storage is completely secure, and we cannot guarantee absolute security.",
    ],
  },
  {
    id: "your-rights",
    title: "Your Rights and Choices",
    paragraphs: [
      "Depending on where you live, you may have rights to:",
      "You can update profile details in Settings. To request account deletion or data access, contact us at the email below.",
    ],
    bullets: [
      "Access, correct, or delete personal information associated with your account.",
      "Export your fitness data where available in the app.",
      "Withdraw consent for optional processing where applicable.",
      "Object to or restrict certain processing, subject to legal exceptions.",
    ],
  },
  {
    id: "children",
    title: "Children",
    paragraphs: [
      "The Service is not directed to children under 13 (or the minimum age required in your jurisdiction). We do not knowingly collect personal information from children. If you believe a child has provided us data, contact us and we will take appropriate steps to delete it.",
    ],
  },
  {
    id: "international",
    title: "International Users",
    paragraphs: [
      "If you access the Service from outside the country where our infrastructure is hosted, your information may be transferred to and processed in other countries that may have different data-protection laws.",
    ],
  },
  {
    id: "changes",
    title: "Changes to This Policy",
    paragraphs: [
      "We may update this Privacy Policy from time to time. We will post the revised version with an updated effective date. Material changes may be communicated through the app or by email where appropriate.",
    ],
  },
  {
    id: "contact",
    title: "Contact Us",
    paragraphs: [
      `Questions about this Privacy Policy or your data can be sent to ${LEGAL_CONTACT_EMAIL}.`,
    ],
  },
];

export const termsSections: LegalSection[] = [
  {
    id: "acceptance",
    title: "Acceptance of Terms",
    paragraphs: [
      "These Terms of Service (\"Terms\") govern your access to and use of Nyx Fitness (\"Nyx Fit\", \"we\", \"us\", or \"our\"), including our website, progressive web app, and related services (the \"Service\").",
      "By accessing or using the Service, you agree to these Terms. If you do not agree, do not use the Service.",
    ],
  },
  {
    id: "eligibility",
    title: "Eligibility",
    paragraphs: [
      "You must be at least 13 years old (or the minimum age required in your jurisdiction) to use the Service. If you are under the age of majority where you live, you may use the Service only with permission from a parent or legal guardian.",
    ],
  },
  {
    id: "account",
    title: "Accounts and Security",
    paragraphs: [
      "You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account. Notify us promptly if you suspect unauthorized access.",
      "You agree to provide accurate account information and keep it up to date.",
    ],
  },
  {
    id: "service",
    title: "The Service",
    paragraphs: [
      "Nyx Fit helps you log workouts, track body metrics, and review training progress. Features may change over time as we improve the product.",
      "We may modify, suspend, or discontinue any part of the Service with reasonable notice where practicable.",
    ],
  },
  {
    id: "user-content",
    title: "Your Content",
    paragraphs: [
      "You retain ownership of the workout logs, metrics, and other content you submit. You grant us a limited license to host, process, and display that content solely to operate and improve the Service for you.",
      "You are responsible for the accuracy of the information you log and for ensuring you have the right to upload any profile content you provide.",
    ],
  },
  {
    id: "acceptable-use",
    title: "Acceptable Use",
    paragraphs: ["You agree not to:"],
    bullets: [
      "Use the Service for unlawful, harmful, or abusive purposes.",
      "Attempt to gain unauthorized access to accounts, systems, or data.",
      "Reverse engineer, scrape, or interfere with the normal operation of the Service.",
      "Upload malware or content that infringes the rights of others.",
    ],
  },
  {
    id: "health-disclaimer",
    title: "Health and Fitness Disclaimer",
    paragraphs: [
      "Nyx Fit is a fitness tracking tool, not a medical device and not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider before starting or changing an exercise program.",
      "You assume all risks associated with physical activity. We are not responsible for injuries or health outcomes resulting from your use of the Service.",
    ],
  },
  {
    id: "disclaimer",
    title: "Disclaimer of Warranties",
    paragraphs: [
      "The Service is provided on an \"as is\" and \"as available\" basis without warranties of any kind, whether express or implied, including implied warranties of merchantability, fitness for a particular purpose, and non-infringement.",
    ],
  },
  {
    id: "liability",
    title: "Limitation of Liability",
    paragraphs: [
      "To the fullest extent permitted by law, Nyx Fit and its affiliates will not be liable for any indirect, incidental, special, consequential, or punitive damages, or for loss of profits, data, or goodwill, arising from your use of the Service.",
      "Our total liability for any claim relating to the Service is limited to the greater of the amount you paid us in the twelve months before the claim or USD $100.",
    ],
  },
  {
    id: "termination",
    title: "Termination",
    paragraphs: [
      "You may stop using the Service at any time. We may suspend or terminate access if you violate these Terms or if necessary to protect the Service or other users.",
      "Sections that by their nature should survive termination will continue to apply.",
    ],
  },
  {
    id: "governing-law",
    title: "Governing Law",
    paragraphs: [
      "These Terms are governed by the laws applicable in the jurisdiction where Nyx Fit operates, without regard to conflict-of-law principles. Mandatory consumer protections in your country of residence still apply where required by law.",
    ],
  },
  {
    id: "changes",
    title: "Changes to These Terms",
    paragraphs: [
      "We may update these Terms from time to time. Continued use of the Service after changes become effective constitutes acceptance of the revised Terms.",
    ],
  },
  {
    id: "contact",
    title: "Contact",
    paragraphs: [
      `Questions about these Terms can be sent to ${LEGAL_CONTACT_EMAIL}.`,
    ],
  },
];
