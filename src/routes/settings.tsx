import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  useAppearance,
  type FontTheme,
  type AttendanceVariant,
} from "@/lib/AppearanceContext";
import { authClient } from "@/lib/auth-client";
import { useCurrentProfile, useUpsertCurrentProfile } from "@/lib/convex/hooks";
import { getEffectiveProfile } from "@/lib/profile";
import type { FitnessLevel } from "@/lib/types";
import {
  ChevronRight,
  User,
  Lock,
  Bell,
  Info,
  HelpCircle,
  Palette,
  Check,
  ChevronLeft,
  Type,
  Timer,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { PageShell, PageHero, ContentContainer } from "@/components/page-shell";
import { useToast } from "@/lib/toast";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

const fontThemes: { id: FontTheme; name: string; description: string; heading: string; body: string; accent: string }[] = [
  {
    id: "night-runner" as FontTheme,
    name: "Night Runner",
    description: "Tech & Sleek",
    heading: "Chakra Petch",
    body: "Titillium Web",
    accent: "#a855f7",
  },
  {
    id: "powerhouse" as FontTheme,
    name: "Powerhouse",
    description: "Bold & Energetic",
    heading: "Oswald",
    body: "Inter",
    accent: "#f97316",
  },
  {
    id: "premium" as FontTheme,
    name: "Premium Athlete",
    description: "Minimalist & Editorial",
    heading: "Space Grotesk",
    body: "DM Sans",
    accent: "#06b6d4",
  },
];

const attendanceVariants: { id: AttendanceVariant; name: string; description: string; accent: string }[] = [
  {
    id: "pill" as AttendanceVariant,
    name: "The Pill Track",
    description: "Glassmorphic, vertical pills",
    accent: "#a855f7",
  },
  {
    id: "circle" as AttendanceVariant,
    name: "Material Circles",
    description: "Clean, circular indicators",
    accent: "#06b6d4",
  },
  {
    id: "bar" as AttendanceVariant,
    name: "Sleek Bar",
    description: "Minimalist heatmap bar",
    accent: "#10b981",
  },
];

const restTimerOptions = [
  { label: "30s", value: 30 },
  { label: "1m", value: 60 },
  { label: "3m", value: 180 },
  { label: "5m", value: 300 },
];

const fitnessModes: { value: FitnessLevel; label: string; description: string; icon: string }[] = [
  { value: "beginner", label: "Beginner", description: "New to lifting, learning fundamentals", icon: "🌱" },
  { value: "intermediate", label: "Intermediate", description: "Consistent training, building routine", icon: "💪" },
  { value: "advanced", label: "Advanced", description: "Experienced lifter, performance-focused", icon: "🔥" },
  { value: "coach", label: "Coach", description: "Training others or managing clients", icon: "📋" },
];

type SettingsView = "main" | "appearance" | "mode";

function SettingsPage() {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const { data: sessionData } = authClient.useSession();
  const session = sessionData?.session ?? null;
  const { profile } = useCurrentProfile({ enabled: !!session });
  const effectiveProfile = getEffectiveProfile(profile, sessionData?.user);
  const { upsertCurrentProfile } = useUpsertCurrentProfile();
  const [currentView, setCurrentView] = useState<SettingsView>("main");
  const [isSavingMode, setIsSavingMode] = useState(false);
  const {
    fontTheme,
    setFontTheme,
    attendanceVariant,
    setAttendanceVariant,
    restTimerDuration,
    setRestTimerDuration,
    attendanceSuccessThreshold,
    setAttendanceSuccessThreshold,
  } = useAppearance();

  const isModeComplete = !!profile?.fitnessLevel;

  const handleLogout = async () => {
    await authClient.signOut();
    navigate({ to: "/login" });
  };

  const handleModeChange = async (newMode: FitnessLevel) => {
    setIsSavingMode(true);
    try {
      await upsertCurrentProfile({
        updates: { fitnessLevel: newMode },
      });
      success("Training mode updated");
      setCurrentView("main");
    } catch (err: any) {
      toastError(err?.message ?? "Failed to update mode");
    } finally {
      setIsSavingMode(false);
    }
  };

  const SettingsItem = ({
    icon: Icon,
    label,
    onClick,
    value,
    isDestructive = false,
  }: {
    icon: React.ElementType;
    label: string;
    onClick?: () => void;
    value?: string;
    isDestructive?: boolean;
  }) => (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between p-4 rounded-2xl transition-all group",
        isDestructive
          ? "hover:bg-red-500/10"
          : "hover:bg-white/[0.08]"
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "h-11 w-11 rounded-xl flex items-center justify-center transition-colors",
            isDestructive
              ? "bg-red-500/15 text-red-400"
              : "bg-white/[0.06] text-zinc-400 group-hover:text-white group-hover:bg-white/[0.1]"
          )}
        >
          <Icon size={20} strokeWidth={1.5} />
        </div>
        <span
          className={cn(
            "font-medium text-[15px]",
            isDestructive ? "text-red-400" : "text-zinc-200"
          )}
        >
          {label}
        </span>
      </div>
      <div className="flex items-center gap-3">
        {value && (
          <span className="text-sm text-zinc-500 font-medium">{value}</span>
        )}
        <ChevronRight size={18} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
      </div>
    </motion.button>
  );

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3 ml-1">
      {children}
    </h3>
  );

  const MainSettings = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col gap-6"
    >
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate({ to: "/settings/profile" })}
        className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.08] hover:border-white/[0.15] transition-all text-left group"
      >
        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 overflow-hidden shadow-lg shadow-purple-500/20">
          {effectiveProfile.profilePicture ? (
            <img
              src={effectiveProfile.profilePicture}
              alt="Profile"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-white font-bold text-lg">
              {effectiveProfile.name?.[0]?.toUpperCase() || "U"}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-white text-[17px] truncate">
            {effectiveProfile.name}
          </h2>
          <p className="text-sm text-zinc-500 truncate">
            {effectiveProfile.email || "Fitness Enthusiast"}
          </p>
        </div>
        <ChevronRight className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
      </motion.button>

      <div className="flex flex-col gap-1">
        <SectionLabel>Personalization</SectionLabel>
        <SettingsItem
          icon={Sparkles}
          label="Training Mode"
          value={isModeComplete ? profile?.fitnessLevel : "Not set"}
          onClick={() => setCurrentView("mode")}
        />
        <SettingsItem
          icon={Palette}
          label="Appearance"
          onClick={() => setCurrentView("appearance")}
        />
      </div>

      <div className="flex flex-col gap-1">
        <SectionLabel>Account</SectionLabel>
        <SettingsItem
          icon={User}
          label="Profile details"
          onClick={() => navigate({ to: "/settings/profile" })}
        />
        <SettingsItem icon={Bell} label="Notifications" />
        <SettingsItem icon={Lock} label="Password" />
      </div>

      <div className="flex flex-col gap-1">
        <SectionLabel>Support</SectionLabel>
        <SettingsItem icon={Info} label="About" />
        <SettingsItem icon={HelpCircle} label="Help & FAQ" />
      </div>

      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={handleLogout}
        className="mt-2 py-4 text-center font-medium text-red-400 rounded-2xl hover:bg-red-500/10 transition-colors"
      >
        Log Out
      </motion.button>
    </motion.div>
  );

  const AppearanceSettings = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col gap-8"
    >
      <button
        onClick={() => setCurrentView("main")}
        className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm font-medium -ml-2"
      >
        <ChevronLeft size={18} />
        <span>Back</span>
      </button>

      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-white">Appearance</h2>
        <p className="text-zinc-500 text-sm">Customize how Nyx Fit looks and feels.</p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <Palette size={18} className="text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Weekly Attendance</h3>
            <p className="text-xs text-zinc-500">How your workout streak is displayed</p>
          </div>
        </div>
        <div className="grid gap-2 pl-13">
          {attendanceVariants.map((variant) => (
            <motion.button
              key={variant.id}
              onClick={() => setAttendanceVariant(variant.id)}
              className={cn(
                "relative p-4 rounded-xl border text-left transition-all",
                attendanceVariant === variant.id
                  ? "bg-white/[0.08] border-purple-500/50"
                  : "bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.06]"
              )}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className={cn(
                    "font-medium",
                    attendanceVariant === variant.id ? "text-white" : "text-zinc-300"
                  )}>
                    {variant.name}
                  </h4>
                  <p className="text-xs text-zinc-500 mt-0.5">{variant.description}</p>
                </div>
                {attendanceVariant === variant.id && (
                  <motion.div
                    layoutId="check-attend"
                    className="h-6 w-6 rounded-full bg-purple-500 flex items-center justify-center"
                  >
                    <Check size={14} className="text-white" />
                  </motion.div>
                )}
              </div>
            </motion.button>
          ))}
        </div>

        <div className="mt-2 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm font-medium text-zinc-300">Weekly Goal</label>
            <span className="text-sm font-bold text-amber-400">{attendanceSuccessThreshold} days</span>
          </div>
          <input
            type="range"
            min="1"
            max="7"
            step="1"
            value={attendanceSuccessThreshold}
            onChange={(e) => setAttendanceSuccessThreshold(parseInt(e.target.value))}
            className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-amber-400"
          />
          <p className="text-xs text-zinc-500 mt-2">
            Unlock success state after {attendanceSuccessThreshold} workouts per week
          </p>
        </div>
      </div>

      <div className="h-px bg-white/[0.06]" />

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
            <Timer size={18} className="text-violet-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Rest Timer</h3>
            <p className="text-xs text-zinc-500">Default duration between sets</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 pl-13">
          {restTimerOptions.map((option) => (
            <motion.button
              key={option.value}
              onClick={() => setRestTimerDuration(option.value)}
              className={cn(
                "py-3.5 rounded-xl border font-medium text-sm transition-all",
                restTimerDuration === option.value
                  ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
                  : "bg-white/[0.02] border-white/[0.08] text-zinc-400 hover:bg-white/[0.06]"
              )}
              whileTap={{ scale: 0.95 }}
            >
              {option.label}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="h-px bg-white/[0.06]" />

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
            <Type size={18} className="text-cyan-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Typography</h3>
            <p className="text-xs text-zinc-500">Font theme for the app</p>
          </div>
        </div>
        <div className="grid gap-2 pl-13">
          {fontThemes.map((theme) => (
            <motion.button
              key={theme.id}
              onClick={() => setFontTheme(theme.id)}
              className={cn(
                "relative p-4 rounded-xl border text-left transition-all",
                fontTheme === theme.id
                  ? "bg-cyan-500/20 border-cyan-500/50"
                  : "bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.06]"
              )}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className={cn(
                    "font-medium",
                    fontTheme === theme.id ? "text-cyan-100" : "text-zinc-200"
                  )}>
                    {theme.name}
                  </h4>
                  <p className="text-xs text-zinc-500 mt-0.5">{theme.description}</p>
                </div>
                {fontTheme === theme.id && (
                  <motion.div
                    layoutId="check-font"
                    className="h-6 w-6 rounded-full bg-cyan-500 flex items-center justify-center"
                  >
                    <Check size={14} className="text-black" />
                  </motion.div>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );

  const ModeSettings = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col gap-6"
    >
      <button
        onClick={() => setCurrentView("main")}
        className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm font-medium -ml-2"
      >
        <ChevronLeft size={18} />
        <span>Back</span>
      </button>

      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-white">Training Mode</h2>
        <p className="text-zinc-500 text-sm">
          Your training mode personalizes your experience. Change anytime.
        </p>
      </div>

      <div className="grid gap-3">
        {fitnessModes.map((mode) => (
          <motion.button
            key={mode.value}
            onClick={() => handleModeChange(mode.value)}
            disabled={isSavingMode}
            className={cn(
              "relative p-5 rounded-2xl border text-left transition-all group",
              profile?.fitnessLevel === mode.value
                ? "bg-purple-500/15 border-purple-500/40"
                : "bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15]",
              isSavingMode && "opacity-50 cursor-not-allowed"
            )}
            whileTap={{ scale: 0.99 }}
          >
            <div className="flex items-center gap-4">
              <div className="text-2xl">{mode.icon}</div>
              <div className="flex-1">
                <h4 className={cn(
                  "font-semibold text-[16px]",
                  profile?.fitnessLevel === mode.value ? "text-white" : "text-zinc-200"
                )}>
                  {mode.label}
                </h4>
                <p className="text-xs text-zinc-500 mt-1">{mode.description}</p>
              </div>
              {profile?.fitnessLevel === mode.value && (
                <motion.div
                  layoutId="check-mode"
                  className="h-7 w-7 rounded-full bg-purple-500 flex items-center justify-center shrink-0"
                >
                  <Check size={16} className="text-white" />
                </motion.div>
              )}
            </div>
          </motion.button>
        ))}
      </div>

      {isSavingMode && (
        <div className="flex items-center justify-center gap-2 py-6">
          <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
          <span className="text-zinc-500">Saving...</span>
        </div>
      )}
    </motion.div>
  );

  return (
    <PageShell>
      <PageHero
        title="Settings"
        accentColor="purple"
        height="small"
      />

      <ContentContainer>
        <AnimatePresence mode="wait">
          {currentView === "main" && <MainSettings key="main" />}
          {currentView === "appearance" && <AppearanceSettings key="appearance" />}
          {currentView === "mode" && <ModeSettings key="mode" />}
        </AnimatePresence>
      </ContentContainer>
    </PageShell>
  );
}
