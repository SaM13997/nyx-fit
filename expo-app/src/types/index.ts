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

// Mobile-specific types
export type AppSettings = {
  theme: 'light' | 'dark' | 'system';
  units: 'metric' | 'imperial';
  restTimerDuration: number;
  hapticFeedback: boolean;
  notifications: {
    workoutReminders: boolean;
    restTimerAlerts: boolean;
  };
};

export type OfflineAction = {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'workout' | 'exercise' | 'weightEntry';
  data: any;
  timestamp: number;
  synced: boolean;
};

// Navigation types
export type RootStackParamList = {
  '(auth)': undefined;
  '(tabs)': undefined;
};

export type TabParamList = {
  index: undefined;
  'workouts/index': undefined;
  'workouts/[id]': { id: string };
  'workouts/create': undefined;
  'weight/index': undefined;
  'stats/index': undefined;
  'settings/index': undefined;
  'settings/profile': undefined;
};

export type WorkoutsStackParamList = {
  index: undefined;
  '[id]': { id: string };
  create: undefined;
};

export type SettingsStackParamList = {
  index: undefined;
  profile: undefined;
};

export type AuthStackParamList = {
  login: undefined;
};