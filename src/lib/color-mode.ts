export type ColorMode = "system" | "light" | "dark";
export type ResolvedColorMode = "light" | "dark";

export const COLOR_MODES = [
  "system",
  "light",
  "dark",
] as const satisfies readonly ColorMode[];
export const DEFAULT_COLOR_MODE: ColorMode = "dark";
export const COLOR_MODE_STORAGE_KEY = "nyx-color-mode";
export const COLOR_MODE_MEDIA_QUERY = "(prefers-color-scheme: light)";
// Must match --background for each mode in src/styles.css.
export const THEME_COLOR: Record<ResolvedColorMode, string> = {
  light: "#fafafa",
  dark: "#09090b",
};

export function isColorMode(value: unknown): value is ColorMode {
  if (typeof value !== "string") return false;
  return value === "system" || value === "light" || value === "dark";
}

export function parseColorMode(raw: string | null): ColorMode {
  return raw !== null && isColorMode(raw) ? raw : DEFAULT_COLOR_MODE;
}

export function resolveColorMode(
  mode: ColorMode,
  prefersLight: boolean,
): ResolvedColorMode {
  return mode === "system" ? (prefersLight ? "light" : "dark") : mode;
}

export function applyColorMode(resolved: ResolvedColorMode): void {
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  const meta = document.querySelector('meta[name="theme-color"]');
  meta?.setAttribute("content", THEME_COLOR[resolved]);
  // Suppress colour transitions for one frame while the theme flips.
  root.classList.add("color-mode-switching");
  getComputedStyle(root).opacity;
  requestAnimationFrame(() => {
    root.classList.remove("color-mode-switching");
  });
}

// Inline, dependency-free copy of parse + resolve + apply, run in <head>
// before paint. Keep it in sync with the functions above; a unit test
// evaluates it against them.
export const COLOR_MODE_SCRIPT =
  `(function(){try{var m=localStorage.getItem("${COLOR_MODE_STORAGE_KEY}");var d=m==="system"||m==="light"||m==="dark"?m:"dark";var p=d==="system"&&window.matchMedia("${COLOR_MODE_MEDIA_QUERY}").matches;var r=d==="light"||p?"light":"dark";var h=document.documentElement;h.classList.toggle("dark",r==="dark");var t=document.querySelector('meta[name="theme-color"]');if(t){t.setAttribute("content",r==="dark"?"#09090b":"#fafafa")}}catch(e){}})()`;
