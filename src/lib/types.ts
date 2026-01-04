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
};

export type WeightGoal = {
  id: string;
  targetWeight: number;
  weeklyGoal: number;
  startDate: string;
  startWeight: number;
};

export type Gender = "male" | "female";

export type FitnessLevel = "beginner" | "intermediary" | "advanced" | "pro";

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
