import type { ExperienceLevel } from "../config";

export type LumenStep = "welcome" | "experience" | "save" | "ready";

export const lumenSteps: LumenStep[] = [
  "welcome",
  "experience",
  "save",
  "ready",
];

export const lumenStepNumber: Record<LumenStep, 1 | 2 | 3 | 4> = {
  welcome: 1,
  experience: 2,
  save: 3,
  ready: 4,
};

export const lumenStepLabel: Record<LumenStep, string> = {
  welcome: "Welcome",
  experience: "Experience",
  save: "Save profile",
  ready: "Ready",
};

export type LumenExperienceOption = {
  value: ExperienceLevel;
  label: string;
  detail: string;
};

export const lumenExperienceOptions: LumenExperienceOption[] = [
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

export function lumenLevelLabel(level: ExperienceLevel | null): string {
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

export const lumenCopy = {
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
  },
  ready: {
    heading: "You\u2019re ready to begin.",
    action: "Get fit",
  },
} as const;
