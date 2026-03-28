export type Workout = {
  id: string;
  date: string;
  duration: number;
  startTime?: string; // ISO string for when workout started
  endTime?: string; // ISO string for when workout ended
  isActive?: boolean; // Whether the workout is currently in progress
  exercises: Exercise[];
  bodyPartWorkedOut?: string[];
  notes?: string;
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
  time?: string;
  source?: "manual" | "scale" | "import";
};

export type WeightGoal = {
  id: string;
  goalType: "loss" | "gain" | "maintenance";
  targetWeight: number;
  startWeight: number;
  startDate: string;
  targetDate?: string;
  weeklyRate?: number;
  acceptableVariance?: number;
  isActive: boolean;
};

export type WeightInsight = {
  id: string;
  type: "milestone" | "trend" | "warning" | "achievement";
  title: string;
  description: string;
  severity: "info" | "success" | "warning" | "alert";
  date: string;
  isRead: boolean;
};

export type WeightStats = {
  currentWeight: number;
  startWeight: number;
  totalChange: number;
  weeklyChange: number;
  minWeight: number;
  maxWeight: number;
  avgWeight: number;
  consistency: number;
  streak: number;
  entries: number;
  movingAverage: number;
};

export type Gender = "male" | "female";

export type FitnessLevel = "beginner" | "intermediate" | "advanced" | "coach";

export type Profile = {
  id: string;
  name: string;
  email: string;
  gender?: Gender;
  profilePicture?: string; // URL of the profile picture uploaded to the convex storage
  fitnessLevel?: FitnessLevel;
  notificationsEnabled: boolean;
  createdAt: string;
};

// Stats types for exercise tracking
export type WeeklyExerciseData = {
  weekStart: string;
  sets: number;
  reps: number;
  volume: number;
  maxWeight: number;
};

export type ExerciseStat = {
  id: string;
  exerciseName: string;
  totalSets: number;
  totalReps: number;
  totalVolume: number;
  maxWeight: number;
  maxWeightReps: number;
  lastPerformedAt: string;
  weeklyHistory: WeeklyExerciseData[];
};

export type WorkoutSummary = {
  totalWorkouts: number;
  averageDuration: number;
  totalExercises: number;
  totalSets: number;
  currentStreak: number;
  longestStreak: number;
  workoutsThisWeek: number;
  workoutsThisMonth: number;
};

export type ExerciseProgression = {
  exerciseName: string;
  currentMaxWeight: number;
  progression: WeeklyExerciseData[];
};
