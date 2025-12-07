import { useAppearance } from "@/lib/AppearanceContext";
import { WeeklyAttendanceV1, WeeklyAttendanceV2, WeeklyAttendanceV3 } from "./WeeklyAttendanceVariations";
import type { Workout } from "@/lib/types";

interface WeeklyAttendanceProps {
  workouts: Workout[];
  isLoading?: boolean;
}

export function WeeklyAttendance({ workouts, isLoading = false }: WeeklyAttendanceProps) {
  const { attendanceVariant } = useAppearance();

  switch (attendanceVariant) {
    case 'circle':
      return <WeeklyAttendanceV2 workouts={workouts} isLoading={isLoading} />;
    case 'bar':
      return <WeeklyAttendanceV3 workouts={workouts} isLoading={isLoading} />;
    case 'pill':
    default:
      return <WeeklyAttendanceV1 workouts={workouts} isLoading={isLoading} />;
  }
}
