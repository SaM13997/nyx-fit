import type { FitnessLevel } from "@/lib/types";

export type Goal =
  | "build-muscle"
  | "get-stronger"
  | "stay-consistent"
  | "coach";
export type LastWeekSessions = "0" | "1-2" | "3-4" | "5+";
export type DaysPerWeek = 2 | 3 | 4 | 5;
export type Equipment =
  | "barbell"
  | "dumbbells"
  | "machines"
  | "bodyweight"
  | "bands";
export type QuizAnswers = {
  goal: Goal | null;
  lastWeekSessions: LastWeekSessions | null;
  daysPerWeek: DaysPerWeek | null;
  equipment: Equipment[];
};
export type StepId =
  | "welcome"
  | "goal"
  | "level"
  | "schedule"
  | "building"
  | "plan-preview"
  | "logger-peek"
  | "auth"
  | "done";
export type StagedOnboarding = {
  fitnessLevel: FitnessLevel | null;
  goal: Goal;
};
export type QuestionOption<T extends string> = {
  value: T;
  label: string;
  detail: string;
};

export const goalOptions: QuestionOption<Goal>[] = [
  {
    value: "build-muscle",
    label: "Build muscle",
    detail: "Make every rep count.",
  },
  {
    value: "get-stronger",
    label: "Get stronger",
    detail: "Build on your best.",
  },
  {
    value: "stay-consistent",
    label: "Stay consistent",
    detail: "Find a rhythm that sticks.",
  },
  {
    value: "coach",
    label: "I coach others",
    detail: "Bring intent to every athlete's training.",
  },
];
export const levelOptions: QuestionOption<LastWeekSessions>[] = [
  { value: "0", label: "0 — Starting fresh", detail: "A fresh start counts." },
  { value: "1-2", label: "1–2 days", detail: "Building your rhythm." },
  { value: "3-4", label: "3–4 days", detail: "Putting in the work." },
  { value: "5+", label: "5 or more", detail: "Training is part of your week." },
];
export const dayOptions: DaysPerWeek[] = [2, 3, 4, 5];
export const equipmentOptions: { value: Equipment; label: string }[] = [
  { value: "barbell", label: "Barbell" },
  { value: "dumbbells", label: "Dumbbells" },
  { value: "machines", label: "Machines" },
  { value: "bodyweight", label: "Bodyweight" },
  { value: "bands", label: "Bands" },
];
export const copy = {
  welcome: {
    heading: "Train with intent.",
    description:
      "Log sets in seconds, see your progress build week after week.",
    meta: "2 minute setup",
    action: "Get Started",
    skip: "I already have an account",
  },
  goal: {
    heading: "What are you chasing?",
    description: "We'll shape your plan around it.",
    action: "Continue",
  },
  level: {
    heading: "How many days did you train last week?",
    description: "Honest beats ambitious. We'll calibrate from here.",
    action: "Continue",
  },
  schedule: {
    heading: "Set your week.",
    days: "Training days per week",
    equipment: "What can you train with?",
    action: "Build my plan",
  },
  building: { heading: "Building your plan…" },
  preview: {
    heading: "Your first week",
    description: "Your plan adapts as you log.",
    action: "Looks right",
  },
  logger: {
    heading: "Logging takes seconds.",
    title: "Push Day",
    exercise: "Bench Press — 3 × 8",
    skip: "Skip preview",
    action: "Continue",
  },
  auth: {
    heading: "Save your plan.",
    description: "One account keeps your plan, history, and progress safe.",
    skip: "Not now — explore without saving",
  },
  done: {
    heading: "You're set.",
    description: "Session 1 is waiting. Start strong.",
    action: "Start first workout",
  },
};

export const headingClass =
  "text-4xl font-bold leading-[1.1] tracking-tight text-white focus:outline-none sm:text-5xl";
export const focusClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black";
export const actionClass = `mt-8 flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-purple-600 px-5 py-4 text-base font-bold text-white shadow-lg shadow-purple-900/20 transition-colors duration-150 hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none ${focusClass}`;
export const linkClass = `flex min-h-11 items-center justify-center rounded-lg px-2 text-sm text-zinc-400 transition-colors hover:text-white motion-reduce:transition-none ${focusClass}`;

export function deriveFitnessLevel(answers: QuizAnswers): FitnessLevel | null {
  if (answers.goal === "coach") return null;
  switch (answers.lastWeekSessions) {
    case "3-4":
      return "intermediary";
    case "5+":
      return "advanced";
    default:
      return "beginner";
  }
}

export function defaultDays(level: LastWeekSessions | null): DaysPerWeek {
  return level === "5+" ? 5 : level === "3-4" ? 4 : 3;
}

const sessionsByDays: Record<DaysPerWeek, string[]> = {
  2: ["Full Body A — Squat, Press, Row", "Full Body B — Hinge, Push, Pull"],
  3: [
    "Full Body A — Squat, Press, Row",
    "Full Body B — Hinge, Push, Pull",
    "Full Body C — Legs, Push, Core",
  ],
  4: [
    "Upper A — Press, Row, Pull",
    "Lower A — Squat, Hinge, Core",
    "Upper B — Push, Pull, Arms",
    "Lower B — Legs, Glutes, Core",
  ],
  5: [
    "Push — Chest, Shoulders, Triceps",
    "Pull — Back, Biceps",
    "Legs — Squat, Hinge, Core",
    "Upper — Push, Pull, Arms",
    "Lower — Legs, Glutes, Core",
  ],
};

export function derivePlan(answers: QuizAnswers) {
  const days = answers.daysPerWeek ?? defaultDays(answers.lastWeekSessions);
  if (answers.goal === "coach") {
    return {
      levelLabel: "Coach",
      days,
      sessions: [
        "Roster ready — templates for your athletes",
        "Session structure — sets, reps, and intent",
        "Progress review — a clear training history",
      ],
    };
  }
  const level = deriveFitnessLevel(answers);
  return {
    levelLabel:
      level === "advanced"
        ? "Advanced"
        : level === "intermediary"
          ? "Intermediate"
          : "Beginner",
    days,
    sessions: sessionsByDays[days],
  };
}

export function buildSequence(goal: Goal | null): StepId[] {
  return [
    "welcome",
    "goal",
    ...(goal === "coach" ? [] : (["level", "schedule"] satisfies StepId[])),
    "building",
    "plan-preview",
    "logger-peek",
    "auth",
    "done",
  ];
}

export const STAGED_KEY = "nyx:onboarding:staged";

export function isStagedOnboarding(value: unknown): value is StagedOnboarding {
  if (
    typeof value !== "object" ||
    value === null ||
    !("goal" in value) ||
    !("fitnessLevel" in value)
  )
    return false;
  const validGoal =
    value.goal === "build-muscle" ||
    value.goal === "get-stronger" ||
    value.goal === "stay-consistent" ||
    value.goal === "coach";
  const validLevel =
    value.fitnessLevel === null ||
    value.fitnessLevel === "beginner" ||
    value.fitnessLevel === "intermediary" ||
    value.fitnessLevel === "advanced" ||
    value.fitnessLevel === "pro";
  return (
    validGoal &&
    validLevel &&
    (value.goal !== "coach" || value.fitnessLevel === null)
  );
}

export function readStagedOnboarding(): StagedOnboarding | null {
  if (typeof window === "undefined") return null;
  try {
    const value: unknown = JSON.parse(
      window.sessionStorage.getItem(STAGED_KEY) ?? "null",
    );
    return isStagedOnboarding(value) ? value : null;
  } catch {
    return null;
  }
}

export function writeStaged(payload: StagedOnboarding) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STAGED_KEY, JSON.stringify(payload));
  } catch {
    return;
  }
}

export function clearStaged() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STAGED_KEY);
  } catch {
    return;
  }
}
