export type Workout = {
  id: string;
  date: string;
  duration: number; // elapsed seconds
  startTime?: string; // ISO string for when workout started
  endTime?: string; // ISO string for when workout ended
  isActive?: boolean; // Whether the workout is currently in progress
  exercises: Exercise[];
  bodyPartWorkedOut?: string[];
  notes?: string;
  revision: number; // Incremented on every accepted edit
};

export type Exercise = {
  id: string;
  name: string;
  sets: WorkoutSet[];
  category?: string;
};

export type WorkoutSet = {
  id: string;
  weight: number;
  reps: number;
};

export type WeightEntry = {
  id: string;
  date: string;
  weight: number;
  note?: string;
  photoUrl?: string;
};

export type WeightGoal = {
  id: string;
  targetWeight: number;
  weeklyGoal: number;
  startDate: string;
  startWeight: number;
};

export type WeightUnit = "lbs" | "kgs";

export type Gender = "male" | "female";

export type FitnessLevel = "beginner" | "intermediary" | "advanced" | "pro";

export type Profile = {
  id: string;
  name: string;
  email: string;
  gender?: Gender;
  profilePicture?: string; // Same-origin image URL or external provider URL
  fitnessLevel?: FitnessLevel;
  notificationsEnabled: boolean;
  weightUnit: WeightUnit;
  weeklyWorkoutGoal?: number; // Saved goal; when absent the default follows fitnessLevel
  timeZone?: string; // IANA zone used to bucket workouts into local weeks
  createdAt: string;
};

// What a workout row needs without its exercises blob (lists, home window).
export type WorkoutListItem = {
  id: string;
  date: string;
  duration: number;
  isActive?: boolean;
  exerciseCount: number;
  totalSets: number;
  totalVolume: number;
  bodyPartWorkedOut?: string[];
};

export type WorkoutCursor = { date: string; createdAt: string; id: string };

export type WorkoutPage = {
  items: WorkoutListItem[];
  nextCursor: WorkoutCursor | null;
};

export type WeeklyExerciseData = {
  weekStart: string;
  sets: number;
  reps: number;
  volume: number;
  maxWeight: number;
};

export type ExerciseHistory = {
  exerciseKey: string;
  weeks: WeeklyExerciseData[];
};

export type WeeklyStat = {
  weekStart: string;
  workouts: number;
  exercises: number;
  sets: number;
  volume: number;
  durationSeconds: number;
};

// Lifetime rollup for one exercise.
export type ExerciseRecord = {
  exerciseKey: string;
  exerciseName: string;
  sessions: number;
  totalSets: number;
  totalReps: number;
  totalVolume: number;
  maxWeight: number;
  maxWeightReps: number;
  lastPerformedAt: string;
};

export type WorkoutExerciseEntry = {
  exerciseKey: string;
  exerciseName: string;
  sets: number;
  reps: number;
  volume: number;
  maxWeight: number;
  maxWeightReps: number;
  isPersonalRecord: boolean;
};

export type LatestWorkout = {
  workout: Workout;
  exercises: WorkoutExerciseEntry[];
};

// "rebuilding": rollups are being rebuilt in the background; the client
// should ask again shortly.
export type StatsStatus = "ready" | "rebuilding";

export type WeeklyGoalStreak = {
  current: number;
  longest: number;
};

// A primary body part and when it was last trained inside the 8-week window
// (null = not seen, i.e. "8w+").
export type BodyPartRecency = {
  bodyPart: string;
  lastWorkedAt: string | null;
};

export type HomeSnapshot = {
  status: StatsStatus;
  activeWorkout: Workout | null;
  // Completed workouts from the last 8 local weeks, newest first.
  recentWorkouts: WorkoutListItem[];
  latestWorkout: LatestWorkout | null;
  // Roughly the last 26 weeks that have any completed workout.
  weeklyStats: WeeklyStat[];
  weeklyWorkoutGoal: number;
  // Exact up to 52 weeks of history; the full picture is in StatsOverview.
  streak: WeeklyGoalStreak;
  weights: WeightEntry[];
  weightGoal: WeightGoal | null;
  leastRecentBodyParts: BodyPartRecency[];
};

export type BodyPartFrequencyEntry = {
  bodyPart: string;
  sessions: number;
};

export type StatsOverview = {
  status: StatsStatus;
  totalWorkouts: number;
  averageDuration: number; // seconds
  totalExercises: number;
  totalSets: number;
  workoutsThisWeek: number;
  workoutsThisMonth: number;
  weeklyWorkoutGoal: number;
  streak: WeeklyGoalStreak;
  weeklyStats: WeeklyStat[]; // last 12 weeks that have any completed workout
  exercises: ExerciseRecord[];
  bodyPartFrequency: BodyPartFrequencyEntry[];
};
