import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type FontTheme = 'night-runner' | 'powerhouse' | 'premium'
export type AttendanceVariant = 'pill' | 'circle' | 'bar'

interface AppearanceContextValue {
  fontTheme: FontTheme
  setFontTheme: (theme: FontTheme) => void
  attendanceVariant: AttendanceVariant
  setAttendanceVariant: (variant: AttendanceVariant) => void
}

const AppearanceContext = createContext<AppearanceContextValue | undefined>(undefined)

const FONT_STORAGE_KEY = 'nyx-font-theme'
const ATTENDANCE_STORAGE_KEY = 'nyx-attendance-variant'

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [fontTheme, setFontThemeState] = useState<FontTheme>('night-runner')
  const [attendanceVariant, setAttendanceVariantState] = useState<AttendanceVariant>('pill')

  useEffect(() => {
    // Load from localStorage
    const storedFont = localStorage.getItem(FONT_STORAGE_KEY) as FontTheme | null
    if (storedFont && ['night-runner', 'powerhouse', 'premium'].includes(storedFont)) {
      setFontThemeState(storedFont)
    }

    const storedAttendance = localStorage.getItem(ATTENDANCE_STORAGE_KEY) as AttendanceVariant | null
    if (storedAttendance && ['pill', 'circle', 'bar'].includes(storedAttendance)) {
      setAttendanceVariantState(storedAttendance)
    }
  }, [])

  useEffect(() => {
    // Apply font theme to document
    const body = document.body
    body.removeAttribute('data-font-theme')

    if (fontTheme === 'powerhouse') {
      body.setAttribute('data-font-theme', 'powerhouse')
    } else if (fontTheme === 'premium') {
      body.setAttribute('data-font-theme', 'premium')
    }

    localStorage.setItem(FONT_STORAGE_KEY, fontTheme)
  }, [fontTheme])

  useEffect(() => {
    localStorage.setItem(ATTENDANCE_STORAGE_KEY, attendanceVariant)
  }, [attendanceVariant])

  return (
    <AppearanceContext.Provider
      value={{
        fontTheme,
        setFontTheme: setFontThemeState,
        attendanceVariant,
        setAttendanceVariant: setAttendanceVariantState
      }}
    >
      {children}
    </AppearanceContext.Provider>
  )
}

export function useAppearance() {
  const context = useContext(AppearanceContext)
  if (!context) {
    throw new Error('useAppearance must be used within AppearanceProvider')
  }
  return context
}
