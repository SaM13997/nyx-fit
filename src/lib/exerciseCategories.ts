export const EXERCISE_CATEGORIES = [
  "chest",
  "back",
  "legs",
  "shoulders",
  "arms",
  "abs",
  "cardio",
  "full_body",
] as const;

export type ExerciseCategory = (typeof EXERCISE_CATEGORIES)[number];

const CATEGORY_KEYWORDS: Record<ExerciseCategory, string[]> = {
  chest: ["bench", "fly", "chest", "press up", "push up", "dip"],
  back: ["row", "pull", "lat", "deadlift", "back", "pulldown", "chin"],
  legs: ["squat", "leg", "lunge", "calf", "glute", "hamstring", "quad", "rdl"],
  shoulders: ["shoulder", "lateral raise", "rear delt", "overhead press", "arnold press", "upright row"],
  arms: ["curl", "tricep", "bicep", "hammer", "skull", "extension", "forearm"],
  abs: ["ab", "core", "crunch", "plank", "sit up", "leg raise"],
  cardio: ["run", "bike", "cycle", "walk", "rower", "elliptical", "stair"],
  full_body: ["clean", "snatch", "thruster", "burpee", "kettlebell swing", "farmer"],
};

export function inferExerciseCategory(name: string): ExerciseCategory {
  const normalized = name.trim().toLowerCase();

  if (!normalized) {
    return "full_body";
  }

  for (const category of EXERCISE_CATEGORIES) {
    if (CATEGORY_KEYWORDS[category].some((keyword) => normalized.includes(keyword))) {
      return category;
    }
  }

  return "full_body";
}

export function formatExerciseCategory(category: string) {
  return category.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}
