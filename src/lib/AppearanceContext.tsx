import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  applyColorMode,
  COLOR_MODE_MEDIA_QUERY,
  COLOR_MODE_STORAGE_KEY,
  DEFAULT_COLOR_MODE,
  parseColorMode,
  resolveColorMode,
  type ColorMode,
  type ResolvedColorMode,
} from "./color-mode";

export type FontTheme = "night-runner" | "powerhouse" | "premium";
export type AttendanceVariant = "pill" | "circle" | "bar";

interface AppearanceContextValue {
  fontTheme: FontTheme;
  setFontTheme: (theme: FontTheme) => void;
  attendanceVariant: AttendanceVariant;
  setAttendanceVariant: (variant: AttendanceVariant) => void;
  restTimerDuration: number;
  setRestTimerDuration: (duration: number) => void;
  colorMode: ColorMode;
  resolvedColorMode: ResolvedColorMode;
  setColorMode: (mode: ColorMode) => void;
}

const AppearanceContext = createContext<AppearanceContextValue | undefined>(
  undefined
);

const FONT_STORAGE_KEY = "nyx-font-theme";
const ATTENDANCE_STORAGE_KEY = "nyx-attendance-variant";
const REST_TIMER_STORAGE_KEY = "nyx-rest-timer-duration";

function isFontTheme(value: unknown): value is FontTheme {
  if (typeof value !== "string") return false;
  return (
    value === "night-runner" || value === "powerhouse" || value === "premium"
  );
}

function isAttendanceVariant(value: unknown): value is AttendanceVariant {
  if (typeof value !== "string") return false;
  return value === "pill" || value === "circle" || value === "bar";
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [fontTheme, setFontThemeState] = useState<FontTheme>("night-runner");
  const [attendanceVariant, setAttendanceVariantState] =
    useState<AttendanceVariant>("pill");
  const [restTimerDuration, setRestTimerDurationState] = useState<number>(180);
  // The initial state is the default so SSR and the first client render
  // agree. The pre-paint script (src/lib/color-mode.ts) has already applied
  // the stored mode before that read lands.
  const [colorMode, setColorModeState] = useState<ColorMode>(DEFAULT_COLOR_MODE);
  const [prefersLight, setPrefersLight] = useState<boolean>(false);
  // Nothing applies or persists until storage has been read on mount, so
  // the default-state pass cannot fight the pre-paint script's fix.
  const [isLoaded, setIsLoaded] = useState(false);

  const resolvedColorMode = resolveColorMode(colorMode, prefersLight);

  useEffect(() => {
    // Load from localStorage
    try {
      const storedFont = localStorage.getItem(FONT_STORAGE_KEY);
      if (isFontTheme(storedFont)) {
        setFontThemeState(storedFont);
      }

      const storedAttendance = localStorage.getItem(ATTENDANCE_STORAGE_KEY);
      if (isAttendanceVariant(storedAttendance)) {
        setAttendanceVariantState(storedAttendance);
      }

      const storedRestTimer = localStorage.getItem(REST_TIMER_STORAGE_KEY);
      if (storedRestTimer !== null) {
        const parsedRestTimer = Number.parseInt(storedRestTimer, 10);
        if (Number.isFinite(parsedRestTimer)) {
          setRestTimerDurationState(parsedRestTimer);
        }
      }

      const storedColorMode = localStorage.getItem(COLOR_MODE_STORAGE_KEY);
      setColorModeState(parseColorMode(storedColorMode));
      // Read the OS preference in the same pass, so a stored "system" never
      // resolves to dark for a frame before the media listener reports.
      setPrefersLight(window.matchMedia(COLOR_MODE_MEDIA_QUERY).matches);
    } catch {
      // Storage can throw in private mode; keep every default.
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(COLOR_MODE_STORAGE_KEY, colorMode);
    } catch {
      // Storage can throw in private mode; the mode still applies this session.
    }
    applyColorMode(resolvedColorMode);
  }, [isLoaded, colorMode, resolvedColorMode]);

  // While the mode is "system" the OS preference drives the resolved mode.
  useEffect(() => {
    if (colorMode !== "system") return;

    const media = window.matchMedia(COLOR_MODE_MEDIA_QUERY);
    const onChange = (event: MediaQueryListEvent) => {
      setPrefersLight(event.matches);
    };
    setPrefersLight(media.matches);
    media.addEventListener("change", onChange);
    return () => {
      media.removeEventListener("change", onChange);
    };
  }, [colorMode]);

  useEffect(() => {
    // Apply font theme to document
    const body = document.body;
    body.removeAttribute("data-font-theme");

    if (fontTheme === "powerhouse") {
      body.setAttribute("data-font-theme", "powerhouse");
    } else if (fontTheme === "premium") {
      body.setAttribute("data-font-theme", "premium");
    }

    localStorage.setItem(FONT_STORAGE_KEY, fontTheme);
  }, [fontTheme]);

  useEffect(() => {
    localStorage.setItem(ATTENDANCE_STORAGE_KEY, attendanceVariant);
  }, [attendanceVariant]);

  useEffect(() => {
    localStorage.setItem(REST_TIMER_STORAGE_KEY, restTimerDuration.toString());
  }, [restTimerDuration]);

  return (
    <AppearanceContext.Provider
      value={{
        fontTheme,
        setFontTheme: setFontThemeState,
        attendanceVariant,
        setAttendanceVariant: setAttendanceVariantState,
        restTimerDuration,
        setRestTimerDuration: setRestTimerDurationState,
        colorMode,
        resolvedColorMode,
        setColorMode: setColorModeState,
      }}
    >
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) {
    throw new Error("useAppearance must be used within AppearanceProvider");
  }
  return context;
}
