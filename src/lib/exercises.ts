export type ExerciseCategory = 
  | "chest"
  | "back"
  | "shoulders"
  | "arms"
  | "legs"
  | "core"
  | "cardio"
  | "full-body";

export interface ExerciseDefinition {
  name: string;
  category: ExerciseCategory;
}

export const EXERCISE_CATEGORIES: { id: ExerciseCategory; label: string; icon: string }[] = [
  { id: "chest", label: "Chest", icon: "💪" },
  { id: "back", label: "Back", icon: "🔙" },
  { id: "shoulders", label: "Shoulders", icon: "🎯" },
  { id: "arms", label: "Arms", icon: "💪" },
  { id: "legs", label: "Legs", icon: "🦵" },
  { id: "core", label: "Core", icon: "🎽" },
  { id: "cardio", label: "Cardio", icon: "❤️" },
  { id: "full-body", label: "Full Body", icon: "🏃" },
];

export const EXERCISES_BY_CATEGORY: Record<ExerciseCategory, string[]> = {
  chest: [
    "Bench Press",
    "Incline Bench Press",
    "Decline Bench Press",
    "Dumbbell Press",
    "Incline Dumbbell Press",
    "Chest Fly",
    "Dumbbell Fly",
    "Push-Up",
    "Cable Crossover",
    "Dip",
  ],
  back: [
    "Deadlift",
    "Pull-Up",
    "Chin-Up",
    "Lat Pulldown",
    "Barbell Row",
    "Dumbbell Row",
    "Seated Row",
    "T-Bar Row",
    "Face Pull",
    "Shrug",
  ],
  shoulders: [
    "Overhead Press",
    "Military Press",
    "Dumbbell Shoulder Press",
    "Lateral Raise",
    "Front Raise",
    "Rear Delt Fly",
    "Arnold Press",
    "Upright Row",
    "Cable Lateral Raise",
  ],
  arms: [
    "Bicep Curl",
    "Dumbbell Curl",
    "Hammer Curl",
    "Preacher Curl",
    "Concentration Curl",
    "Tricep Extension",
    "Tricep Pushdown",
    "Skull Crusher",
    "Close-Grip Bench",
    "Dip",
  ],
  legs: [
    "Squat",
    "Front Squat",
    "Leg Press",
    "Lunge",
    "Bulgarian Split Squat",
    "Leg Extension",
    "Leg Curl",
    "Calf Raise",
    "Romanian Deadlift",
    "Hip Thrust",
  ],
  core: [
    "Plank",
    "Crunch",
    "Leg Raise",
    "Russian Twist",
    "Ab Wheel",
    "Cable Crunch",
    "Hanging Leg Raise",
    "Dead Bug",
    "Mountain Climber",
    "Bird Dog",
  ],
  cardio: [
    "Treadmill",
    "Running",
    "Cycling",
    "Rowing",
    "Jump Rope",
    "Burpee",
    "Box Jump",
    "Kettlebell Swing",
    "Battle Ropes",
    "Stair Climber",
  ],
  "full-body": [
    "Clean and Jerk",
    "Snatch",
    "Clean",
    "Thruster",
    "Kettlebell Snatch",
    "Burpee",
    "Man Maker",
    "Turkish Get-Up",
  ],
};

export const ALL_EXERCISES = Object.values(EXERCISES_BY_CATEGORY).flat();

export function getExerciseCategory(exerciseName: string): ExerciseCategory {
  for (const [category, exercises] of Object.entries(EXERCISES_BY_CATEGORY)) {
    if (exercises.some(e => e.toLowerCase() === exerciseName.toLowerCase())) {
      return category as ExerciseCategory;
    }
  }
  return "full-body";
}

export function getCategoryForExercise(exerciseName: string): ExerciseCategory {
  return getExerciseCategory(exerciseName);
}
