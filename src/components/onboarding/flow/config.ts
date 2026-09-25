import type { ExperienceLevel } from "../config";

export type FlowStep = "welcome" | "experience" | "save" | "ready";

export const steps: FlowStep[] = [
  "welcome",
  "experience",
  "save",
  "ready",
];

export const stepNumbers: Record<FlowStep, 1 | 2 | 3 | 4> = {
  welcome: 1,
  experience: 2,
  save: 3,
  ready: 4,
};

export const stepLabels: Record<FlowStep, string> = {
  welcome: "Welcome",
  experience: "Experience",
  save: "Save profile",
  ready: "Ready",
};

export type ExperienceOption = {
  value: ExperienceLevel;
  label: string;
  detail: string;
};

export const experienceOptions: ExperienceOption[] = [
  {
    value: "beginner",
    label: "Beginner",
    detail: "Learning the basics and building a foundation.",
  },
  {
    value: "intermediary",
    label: "Intermediate",
    detail: "Comfortable with the basics and training consistently.",
  },
  {
    value: "advanced",
    label: "Advanced",
    detail: "Experienced and managing my own programming.",
  },
];

export function levelLabel(level: ExperienceLevel | null): string {
  switch (level) {
    case "beginner":
      return "Beginner";
    case "intermediary":
      return "Intermediate";
    case "advanced":
      return "Advanced";
    default:
      return "Not set";
  }
}

export const flowCopy = {
  welcome: {
    heading: "Train with intent.",
    description:
      "Log your workouts. See your progress. Build a rhythm that lasts.",
    action: "Set up my profile",
    existing: "I already have an account",
    art: { effort: "Your effort.", progress: "Your progress." },
    capsule: "One workout at a time.",
  },
  experience: {
    heading: "Find your starting point.",
    description:
      "Choose your training experience. You can change this anytime.",
    action: "Continue",
  },
  save: {
    heading: "Keep your momentum.",
    description: "Save your profile and keep your workouts in one place.",
    cardEyebrow: "Your training profile",
    cardTitle: "Ready when you are.",
    cardLabel: "Training experience",
    capsule: "Your progress, together.",
    action: "Continue with Google",
    emailAction: {
      signup: "Sign up with email instead",
      signin: "Sign in with email instead",
    },
    emailForm: {
      nameLabel: "Name",
      namePlaceholder: "Optional",
      emailLabel: "Email",
      emailPlaceholder: "you@example.com",
      passwordLabel: "Password",
      passwordPlaceholder: {
        signup: "At least 8 characters",
        signin: "Your password",
      },
      submit: { signup: "Create account", signin: "Sign in" },
      submitting: {
        signup: "Creating your account…",
        signin: "Signing you in…",
      },
      tryAgain: "Try again",
      collapse: "Back to Google",
      emailRequired: "Enter your email address.",
      passwordRequired: "Enter your password.",
    },
  },
  ready: {
    heading: "You\u2019re ready to begin.",
    action: "Get fit",
    remindersTitle: "Reminders",
    remindersDescription: "Rest timer alerts while you\u2019re away from the app.",
    remindersErrorUnsupported: "Notifications are not supported on this device.",
    remindersErrorDenied:
      "Notifications are blocked. Allow them in your device settings and try again.",
    remindersErrorDismissed:
      "Permission was dismissed. Tap again to allow notifications.",
    remindersErrorSave: "Couldn\u2019t save that. Try again.",
  },
} as const;
