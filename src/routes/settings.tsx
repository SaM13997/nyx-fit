import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { APP_VERSION } from "@/lib/version";
import {
  useAppearance,
  type FontTheme,
  type AttendanceVariant,
} from "@/lib/AppearanceContext";
import { authClient } from "@/lib/auth-client";
import { useCurrentProfile, useUpsertCurrentProfile } from "@/lib/api/hooks";
import { MAX_WEEKLY_GOAL, MIN_WEEKLY_GOAL, resolveWeeklyGoal } from "@/lib/goals";
import { getEffectiveProfile } from "@/lib/profile";
import {
  ChevronRight,
  User,
  Lock,
  Bell,
  BellRing,
  Info,
  HelpCircle,
  FileText,
  Shield,
  Trash2,
  Palette,
  Check,
  ChevronLeft,
  Type,
  Timer,
} from "lucide-react";
import {
  ViewTransition,
  addTransitionType,
  startTransition,
  useEffect,
  useRef,
  useState,
} from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { pressScale } from "@/lib/motion";
import { Switch } from "@/components/ui/switch";
import {
  getNotificationPermission,
  requestNotificationPermission,
  showSystemNotification,
  type NotificationPermissionState,
} from "@/lib/notifications";
import { useToast } from "@/lib/toast";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

const fontThemes = [
  {
    id: "night-runner" as FontTheme,
    name: "Night Runner",
    description: "Tech & Sleek",
    heading: "Chakra Petch",
    body: "Titillium Web",
  },
  {
    id: "powerhouse" as FontTheme,
    name: "Powerhouse",
    description: "Bold & Energetic",
    heading: "Oswald",
    body: "Inter",
  },
  {
    id: "premium" as FontTheme,
    name: "Premium Athlete",
    description: "Minimalist & Editorial",
    heading: "Space Grotesk",
    body: "DM Sans",
  },
];

const attendanceVariants = [
  {
    id: "pill" as AttendanceVariant,
    name: "The Pill Track",
    description: "Glassmorphic, vertical pills",
  },
  {
    id: "circle" as AttendanceVariant,
    name: "Material Circles",
    description: "Clean, circular indicators",
  },
  {
    id: "bar" as AttendanceVariant,
    name: "Sleek Bar",
    description: "Minimalist heatmap bar",
  },
];

const restTimerOptions = [
  { label: "30s", value: 30 },
  { label: "1m", value: 60 },
  { label: "3m", value: 180 },
  { label: "5m", value: 300 },
];

type SettingsView = "main" | "appearance";

const SUBVIEW_TRANSITION = {
  "nav-forward": "vt-subview-forward",
  "nav-back": "vt-subview-back",
  default: "none",
};


function SettingsPage() {
  const navigate = useNavigate();
  const { data: sessionData } = authClient.useSession();
  const session = sessionData?.session ?? null;
  const { profile } = useCurrentProfile({ enabled: !!session });
  const effectiveProfile = getEffectiveProfile(profile, sessionData?.user);
  const [currentView, setCurrentView] = useState<SettingsView>("main");
  const viewHeadingRef = useRef<HTMLHeadingElement>(null);
  const openedViewRef = useRef(false);

  // Sub-screens slide via React's <ViewTransition>; the type picks direction.
  const openView = (next: SettingsView) => {
    openedViewRef.current = true;
    startTransition(() => {
      addTransitionType(next === "main" ? "nav-back" : "nav-forward");
      setCurrentView(next);
    });
  };

  useEffect(() => {
    if (!openedViewRef.current) return;
    window.scrollTo({ top: 0 });
    if (currentView === "appearance") viewHeadingRef.current?.focus({ preventScroll: true });
  }, [currentView]);
  const {
    fontTheme,
    setFontTheme,
    attendanceVariant,
    setAttendanceVariant,
    restTimerDuration,
    setRestTimerDuration,
  } = useAppearance();

  const { upsertCurrentProfile, isPending: isSavingProfile } = useUpsertCurrentProfile();
  const weeklyGoal = resolveWeeklyGoal(profile?.weeklyWorkoutGoal, profile?.fitnessLevel);
  const { error: showError } = useToast();
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermissionState>("unsupported");
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const requestingRef = useRef(false);

  useEffect(() => {
    const refreshPermission = () =>
      setNotificationPermission(getNotificationPermission());
    refreshPermission();
    document.addEventListener("visibilitychange", refreshPermission);
    window.addEventListener("focus", refreshPermission);
    return () => {
      document.removeEventListener("visibilitychange", refreshPermission);
      window.removeEventListener("focus", refreshPermission);
    };
  }, []);

  const notificationEnabled =
    (profile?.notificationsEnabled ?? false) &&
    notificationPermission === "granted";

  const notificationsDescription = (() => {
    if (notificationPermission === "unsupported")
      return "Not supported on this browser";
    if (notificationPermission === "denied")
      return "Blocked — allow notifications in your device settings";
    if (notificationEnabled)
      return "On — rest timer alerts appear on your device";
    if (notificationPermission === "granted")
      return "Off — tap to turn system notifications back on";
    return "Off — tap to allow system notifications";
  })();

  const handleToggleNotifications = async () => {
    if (!profile || requestingRef.current) return;

    if (notificationEnabled) {
      requestingRef.current = true;
      try {
        await upsertCurrentProfile({ updates: { notificationsEnabled: false } });
      } finally {
        requestingRef.current = false;
      }
      return;
    }

    if (notificationPermission === "unsupported") {
      showError("Notifications are not supported on this browser.");
      return;
    }

    if (notificationPermission === "denied") {
      showError(
        "Notifications are blocked. Allow them in your device settings, then try again."
      );
      return;
    }

    requestingRef.current = true;
    setIsRequestingPermission(true);
    try {
      const permission = await requestNotificationPermission();
      setNotificationPermission(permission);
      if (permission === "granted") {
        await upsertCurrentProfile({ updates: { notificationsEnabled: true } });
      } else if (permission === "denied") {
        showError(
          "Notifications are blocked. Allow them in your device settings, then try again."
        );
      } else if (permission === "default") {
        showError("Permission was dismissed. Tap again to allow notifications.");
      }
    } finally {
      requestingRef.current = false;
      setIsRequestingPermission(false);
    }
  };

  const handleTestNotification = async () => {
    const shown = await showSystemNotification("Nyx Fit", {
      body: "System notifications are working. Rest timer alerts will appear like this.",
      tag: "nyx-test",
    });
    if (!shown) {
      showError(
        "Could not show a notification. Check your notification permission."
      );
    }
  };

  const handleWeeklyGoalChange = async (next: number) => {
    if (isSavingProfile) return;
    if (next < MIN_WEEKLY_GOAL || next > MAX_WEEKLY_GOAL) return;
    try {
      await upsertCurrentProfile({ updates: { weeklyWorkoutGoal: next } });
    } catch {
      showError("Couldn't save your weekly goal. Try again.");
    }
  };

  const handleLogout = async () => {
    await authClient.signOut();
    navigate({ to: "/login" });
  };

  const mainSettings = (
    <div className="flex flex-col gap-6">
      {/* User Profile Card */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate({ to: "/settings/profile" })}
        className="w-full flex items-center gap-4 p-4 bg-white/10 rounded-2xl border border-white/10 text-left"
      >
        <div className="h-14 w-14 rounded-full bg-linear-to-tr from-purple-500 to-blue-500 overflow-hidden">
          {effectiveProfile.profilePicture && (
            <img
              src={effectiveProfile.profilePicture}
              alt="Profile"
              className="h-full w-full object-cover"
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-lg text-white truncate">
            {effectiveProfile.name}
          </h2>
          <p className="text-sm text-zinc-400 truncate">
            {effectiveProfile.email || "Fitness Enthusiast"}
          </p>
        </div>
        <ChevronRight className="text-zinc-500" />
      </motion.button>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider ml-2">
          App Settings
        </h3>
        <SettingsItem
          icon={Palette}
          label="Appearance"
          onClick={() => openView("appearance")}
        />
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider ml-2">
          Account
        </h3>
        <SettingsItem
          icon={User}
          label="Profile details"
          onClick={() => navigate({ to: "/settings/profile" })}
        />
        <SettingsItem icon={Lock} label="Password" />
        <label className="w-full flex items-center justify-between gap-3 p-4 min-h-[3.25rem] bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
          <span className="flex items-center gap-3 text-left">
            <span className="h-10 w-10 rounded-full flex items-center justify-center bg-white/10 text-zinc-400">
              <Bell size={20} />
            </span>
            <span className="flex flex-col">
              <span className="font-medium text-zinc-200">Notifications</span>
              <span className="text-xs text-zinc-500">
                {notificationsDescription}
              </span>
            </span>
          </span>
          <Switch
            checked={notificationEnabled}
            disabled={!profile || isRequestingPermission}
            onCheckedChange={() => void handleToggleNotifications()}
          />
        </label>
        <SettingsItem
          icon={BellRing}
          label="Send test notification"
          onClick={() => void handleTestNotification()}
          disabled={!notificationEnabled}
        />
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider ml-2">
          Legal
        </h3>
        <SettingsItem
          icon={Shield}
          label="Privacy Policy"
          onClick={() => navigate({ to: "/privacy" })}
        />
        <SettingsItem
          icon={FileText}
          label="Terms of Service"
          onClick={() => navigate({ to: "/terms" })}
        />
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider ml-2">
          Support
        </h3>
        <SettingsItem icon={Info} label="About application" value={APP_VERSION} />
        <SettingsItem icon={HelpCircle} label="Help/FAQ" />
        <SettingsItem
          icon={Trash2}
          label="Deactivate my account"
          isDestructive
        />
      </div>

      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={handleLogout}
        className="mt-4 w-full py-4 text-center font-semibold text-red-500 rounded-2xl border border-white/5 bg-white/5 hover:bg-black transition-colors"
      >
        Log Out
      </motion.button>
    </div>
  );

  const appearanceSettings = (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={() => openView("main")}
        className="-ml-2 flex min-h-11 items-center gap-1 self-start rounded-full pl-1 pr-3 text-zinc-400 transition-colors hover:text-white active:bg-white/5"
      >
        <ChevronLeft size={20} />
        <span className="font-medium">Back</span>
      </button>

      <h2
        ref={viewHeadingRef}
        tabIndex={-1}
        className="-mt-4 text-2xl font-bold bg-linear-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent outline-none"
      >
        Appearance
      </h2>

      {/* Weekly Attendance Selector */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Palette size={20} className="text-purple-400" />
          Wait, what was that card?
        </h3>
        <p className="text-sm text-zinc-400">
          Choose how your weekly progress is displayed on the home screen.
        </p>

        <div className="grid gap-3">
          {attendanceVariants.map((variant) => (
            <motion.button
              key={variant.id}
              onClick={() => setAttendanceVariant(variant.id)}
              className={cn(
                "relative p-4 rounded-xl border text-left transition-all",
                attendanceVariant === variant.id
                  ? "bg-purple-900/20 border-purple-500/50"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              )}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4
                    className={cn(
                      "font-semibold",
                      attendanceVariant === variant.id
                        ? "text-purple-300"
                        : "text-zinc-200"
                    )}
                  >
                    {variant.name}
                  </h4>
                  <p className="text-xs text-zinc-500">{variant.description}</p>
                </div>
                {attendanceVariant === variant.id && (
                  <motion.div
                    layoutId="check-attend"
                    className="bg-purple-500 rounded-full p-1"
                  >
                    <Check size={14} className="text-black" />
                  </motion.div>
                )}
              </div>
            </motion.button>
          ))}
        </div>

        {/* Weekly workout goal (saved on the profile; drives streaks) */}
        <div className="mt-4 p-4 rounded-xl border border-white/10 bg-white/5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 id="weekly-goal-label" className="text-sm font-medium text-zinc-300">
                Weekly goal
              </h4>
              <p className="text-xs text-zinc-500 mt-1">
                Hit it each week to build your streak.
              </p>
            </div>
            <div role="group" aria-labelledby="weekly-goal-label" className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Decrease weekly goal"
                disabled={isSavingProfile || weeklyGoal <= MIN_WEEKLY_GOAL}
                onClick={() => void handleWeeklyGoalChange(weeklyGoal - 1)}
                className="h-11 w-11 rounded-full bg-white/10 text-lg font-bold text-white transition-colors hover:bg-white/15 disabled:opacity-40"
              >
                −
              </button>
              <output
                aria-live="polite"
                className="min-w-20 text-center text-sm font-bold tabular-nums text-amber-500"
              >
                {weeklyGoal} {weeklyGoal === 1 ? "workout" : "workouts"}
              </output>
              <button
                type="button"
                aria-label="Increase weekly goal"
                disabled={isSavingProfile || weeklyGoal >= MAX_WEEKLY_GOAL}
                onClick={() => void handleWeeklyGoalChange(weeklyGoal + 1)}
                className="h-11 w-11 rounded-full bg-white/10 text-lg font-bold text-white transition-colors hover:bg-white/15 disabled:opacity-40"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-white/10" />

      {/* Rest Timer Selector */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Timer size={20} className="text-violet-400" />
          Rest Timer
        </h3>
        <p className="text-sm text-zinc-400">
          Default rest duration between sets.
        </p>
        <div className="grid grid-cols-4 gap-2">
          {restTimerOptions.map((option) => (
            <motion.button
              key={option.value}
              onClick={() => setRestTimerDuration(option.value)}
              className={cn(
                "min-h-11 py-3 rounded-xl border font-bold transition-all",
                restTimerDuration === option.value
                  ? "bg-violet-900/20 border-violet-500/50 text-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.1)]"
                  : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10"
              )}
              whileTap={{ scale: 0.95 }}
            >
              {option.label}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="h-px bg-white/10" />

      {/* Font Theme Selector */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Type size={20} className="text-cyan-400" />
          Typography
        </h3>
        <div className="grid gap-3">
          {fontThemes.map((theme) => (
            <motion.button
              key={theme.id}
              onClick={() => setFontTheme(theme.id)}
              className={cn(
                "relative p-4 rounded-xl border text-left transition-all",
                fontTheme === theme.id
                  ? "bg-cyan-900/20 border-cyan-500/50"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              )}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4
                    className={cn(
                      "font-semibold",
                      fontTheme === theme.id ? "text-cyan-300" : "text-zinc-200"
                    )}
                  >
                    {theme.name}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1">
                    <span className="bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                      {theme.heading}
                    </span>
                    <span>+</span>
                    <span className="bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                      {theme.body}
                    </span>
                  </div>
                </div>
                {fontTheme === theme.id && (
                  <motion.div
                    layoutId="check-font"
                    className="bg-cyan-500 rounded-full p-1"
                  >
                    <Check size={14} className="text-black" />
                  </motion.div>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh overflow-x-clip px-4 pb-32 pt-[max(1.5rem,env(safe-area-inset-top))] text-white">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <ViewTransition
        key={currentView}
        enter={SUBVIEW_TRANSITION}
        exit={SUBVIEW_TRANSITION}
        default="none"
      >
        <div>{currentView === "main" ? mainSettings : appearanceSettings}</div>
      </ViewTransition>
    </div>
  );
}

function SettingsItem({
  icon: Icon,
  label,
  onClick,
  value,
  isDestructive = false,
  disabled = false,
}: {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  value?: string;
  isDestructive?: boolean;
  disabled?: boolean;
}) {
  return (
    <motion.button
      whileTap={disabled ? undefined : pressScale}
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full flex items-center justify-between p-4 min-h-[3.25rem] bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors",
        disabled && "opacity-50"
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center",
            isDestructive
              ? "bg-red-500/10 text-red-500"
              : "bg-white/10 text-zinc-400"
          )}
        >
          <Icon size={20} />
        </div>
        <span
          className={cn(
            "font-medium",
            isDestructive ? "text-red-500" : "text-zinc-200"
          )}
        >
          {label}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-sm text-zinc-500">{value}</span>}
        <ChevronRight size={18} className="text-zinc-600" />
      </div>
    </motion.button>
  );
}
