import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppearance, type FontTheme, type AttendanceVariant } from '@/lib/AppearanceContext'
import { authClient } from '@/lib/auth-client'
import {
  ChevronRight,
  User,
  Lock,
  Bell,
  Moon,
  Info,
  HelpCircle,
  Trash2,
  LogOut,
  Palette,
  Check,
  ChevronLeft,
  Type,
  Timer
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})

const fontThemes = [
  {
    id: 'night-runner' as FontTheme,
    name: 'Night Runner',
    description: 'Tech & Sleek',
    heading: 'Chakra Petch',
    body: 'Titillium Web',
  },
  {
    id: 'powerhouse' as FontTheme,
    name: 'Powerhouse',
    description: 'Bold & Energetic',
    heading: 'Oswald',
    body: 'Inter',
  },
  {
    id: 'premium' as FontTheme,
    name: 'Premium Athlete',
    description: 'Minimalist & Editorial',
    heading: 'Space Grotesk',
    body: 'DM Sans',
  },
]

const attendanceVariants = [
  {
    id: 'pill' as AttendanceVariant,
    name: 'The Pill Track',
    description: 'Glassmorphic, vertical pills',
  },
  {
    id: 'circle' as AttendanceVariant,
    name: 'Material Circles',
    description: 'Clean, circular indicators',
  },
  {
    id: 'bar' as AttendanceVariant,
    name: 'Sleek Bar',
    description: 'Minimalist heatmap bar',
  },
]

const restTimerOptions = [
  { label: '30s', value: 30 },
  { label: '1m', value: 60 },
  { label: '3m', value: 180 },
  { label: '5m', value: 300 },
]

type SettingsView = 'main' | 'appearance'

function SettingsPage() {
  const navigate = useNavigate()
  const { data: sessionData } = authClient.useSession()
  const [currentView, setCurrentView] = useState<SettingsView>('main')
  const {
    fontTheme,
    setFontTheme,
    attendanceVariant,
    setAttendanceVariant,
    restTimerDuration,
    setRestTimerDuration
  } = useAppearance()

  const handleLogout = async () => {
    await authClient.signOut()
    navigate({ to: '/login' })
  }

  // Sub-components for cleaner render
  const SettingsItem = ({
    icon: Icon,
    label,
    onClick,
    value,
    isDestructive = false
  }: {
    icon: any,
    label: string,
    onClick?: () => void,
    value?: string,
    isDestructive?: boolean
  }) => (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "h-10 w-10 rounded-full flex items-center justify-center",
          isDestructive ? "bg-red-500/10 text-red-500" : "bg-white/10 text-zinc-400"
        )}>
          <Icon size={20} />
        </div>
        <span className={cn(
          "font-medium",
          isDestructive ? "text-red-500" : "text-zinc-200"
        )}>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-sm text-zinc-500">{value}</span>}
        <ChevronRight size={18} className="text-zinc-600" />
      </div>
    </motion.button>
  )

  const MainSettings = () => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col gap-6"
    >
      {/* User Profile Card */}
      <div className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl border border-white/10">
        <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 overflow-hidden">
          {sessionData?.user.image && (
            <img src={sessionData.user.image} alt="Profile" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="flex-1">
          <h2 className="font-bold text-lg text-white">{sessionData?.user.name}</h2>
          <p className="text-sm text-zinc-400">Fitness Enthusiast</p>
        </div>
        <ChevronRight className="text-zinc-500" />
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider ml-2">App Settings</h3>
        <SettingsItem icon={Palette} label="Appearance" onClick={() => setCurrentView('appearance')} />
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider ml-2">Account</h3>
        <SettingsItem icon={User} label="Profile details" />
        <SettingsItem icon={Lock} label="Password" />
        <SettingsItem icon={Bell} label="Notifications" />
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider ml-2">Support</h3>
        <SettingsItem icon={Info} label="About application" />
        <SettingsItem icon={HelpCircle} label="Help/FAQ" />
        <SettingsItem icon={Trash2} label="Deactivate my account" isDestructive />
      </div>

      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={handleLogout}
        className="mt-4 w-full py-4 text-center font-semibold text-red-500 rounded-2xl border border-white/5 bg-white/5 hover:bg-black transition-colors"
      >
        Log Out
      </motion.button>
    </motion.div>
  )

  const AppearanceSettings = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex flex-col gap-6"
    >
      <button
        onClick={() => setCurrentView('main')}
        className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-2"
      >
        <ChevronLeft size={20} />
        <span className="font-medium">Back</span>
      </button>

      <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
        Appearance
      </h2>

      {/* Weekly Attendance Selector */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Palette size={20} className="text-purple-400" />
          Wait, what was that card?
        </h3>
        <p className="text-sm text-zinc-400">Choose how your weekly progress is displayed on the home screen.</p>

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
                  <h4 className={cn(
                    "font-semibold",
                    attendanceVariant === variant.id ? "text-purple-300" : "text-zinc-200"
                  )}>{variant.name}</h4>
                  <p className="text-xs text-zinc-500">{variant.description}</p>
                </div>
                {attendanceVariant === variant.id && (
                  <motion.div layoutId="check-attend" className="bg-purple-500 rounded-full p-1">
                    <Check size={14} className="text-black" />
                  </motion.div>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="h-px bg-white/10" />

      {/* Rest Timer Selector */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Timer size={20} className="text-orange-400" />
          Rest Timer
        </h3>
        <p className="text-sm text-zinc-400">Default rest duration between sets.</p>
        <div className="grid grid-cols-4 gap-2">
          {restTimerOptions.map((option) => (
            <motion.button
              key={option.value}
              onClick={() => setRestTimerDuration(option.value)}
              className={cn(
                "py-3 rounded-xl border font-bold transition-all",
                restTimerDuration === option.value
                  ? "bg-orange-900/20 border-orange-500/50 text-orange-300 shadow-[0_0_15px_rgba(249,115,22,0.1)]"
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
                  <h4 className={cn(
                    "font-semibold",
                    fontTheme === theme.id ? "text-cyan-300" : "text-zinc-200"
                  )}>{theme.name}</h4>
                  <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1">
                    <span className="bg-white/5 px-1.5 py-0.5 rounded border border-white/5">{theme.heading}</span>
                    <span>+</span>
                    <span className="bg-white/5 px-1.5 py-0.5 rounded border border-white/5">{theme.body}</span>
                  </div>
                </div>
                {fontTheme === theme.id && (
                  <motion.div layoutId="check-font" className="bg-cyan-500 rounded-full p-1">
                    <Check size={14} className="text-black" />
                  </motion.div>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  )

  return (
    <div className="px-4 py-6 pb-24 min-h-screen text-white">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <AnimatePresence mode="wait">
        {currentView === 'main' ? (
          <MainSettings key="main" />
        ) : (
          <AppearanceSettings key="appearance" />
        )}
      </AnimatePresence>
    </div>
  )
}
