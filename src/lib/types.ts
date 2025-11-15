export type Workout = {
  id: string;
  date: string;
  duration: number;
  startTime?: string; // ISO string for when workout started
  endTime?: string; // ISO string for when workout ended
  isActive?: boolean; // Whether the workout is currently in progress
  exercises: Exercise[];
  notes?: string;
};

export type Exercise = {
  id: string;
  name: string;
  sets: Set[];
  category?: string;
};

export type Set = {
  id: string;
  weight: number;
  reps: number;
};

export type WeightEntry = {
  id: string;
  date: string;
  weight: number;
  note?: string;
};

export type Profile = {
  id: string;
  name: string;
  email: string;
  gender?: "male" | "female";
  profilePicture?: string; // URL of the profile picture uploaded to the convex storage
  fitnessLevel?: string; // beginner, intermediary, advanced, pro
  notificationsEnabled: boolean;
  createdAt: string;
};
