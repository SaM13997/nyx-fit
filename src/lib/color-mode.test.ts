// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  COLOR_MODES,
  COLOR_MODE_SCRIPT,
  COLOR_MODE_STORAGE_KEY,
  DEFAULT_COLOR_MODE,
  isColorMode,
  parseColorMode,
  resolveColorMode,
  THEME_COLOR,
  type ColorMode,
  type ResolvedColorMode,
} from "./color-mode";

const INVALID_MODES: (string | null)[] = [null, "", "DARK", "sepia"];

describe("color mode parsing", () => {
  it("rejects invalid stored values", () => {
    for (const raw of INVALID_MODES) {
      expect(isColorMode(raw)).toBe(false);
      expect(parseColorMode(raw)).toBe(DEFAULT_COLOR_MODE);
    }
  });

  it("accepts every mode in COLOR_MODES", () => {
    for (const mode of COLOR_MODES) {
      expect(isColorMode(mode)).toBe(true);
      expect(parseColorMode(mode)).toBe(mode);
    }
  });

  it("narrows accepted values to ColorMode", () => {
    const value: unknown = "light";
    if (isColorMode(value)) {
      const mode: ColorMode = value;
      expect(mode).toBe("light");
    } else {
      expect.unreachable("guard rejected a known mode");
    }
  });
});

describe("resolveColorMode", () => {
  it("resolves every mode against both OS preferences", () => {
    const cases: [ColorMode, boolean, ResolvedColorMode][] = [
      ["system", true, "light"],
      ["system", false, "dark"],
      ["light", true, "light"],
      ["light", false, "light"],
      ["dark", true, "dark"],
      ["dark", false, "dark"],
    ];
    for (const [mode, prefersLight, expected] of cases) {
      expect(resolveColorMode(mode, prefersLight)).toBe(expected);
    }
  });
});

describe("COLOR_MODE_SCRIPT", () => {
  const storedValues: (string | null)[] = [null, ...COLOR_MODES, "DARK", "sepia"];
  const mediaStates: boolean[] = [true, false];

  function installThemeMeta(): HTMLMetaElement {
    document.querySelector('meta[name="theme-color"]')?.remove();
    const meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    document.head.appendChild(meta);
    return meta;
  }

  function runScript(): void {
    new Function(COLOR_MODE_SCRIPT)();
  }

  beforeEach(() => {
    // The server default is dark; the script must be able to both add and
    // remove the class from this starting state.
    document.documentElement.className = "dark";
    localStorage.removeItem(COLOR_MODE_STORAGE_KEY);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resolves each stored value like resolveColorMode under both OS preferences", () => {
    const meta = installThemeMeta();
    for (const prefersLight of mediaStates) {
      vi.stubGlobal("matchMedia", () => ({ matches: prefersLight }));
      for (const stored of storedValues) {
        if (stored === null) {
          localStorage.removeItem(COLOR_MODE_STORAGE_KEY);
        } else {
          localStorage.setItem(COLOR_MODE_STORAGE_KEY, stored);
        }
        document.documentElement.className = "dark";
        runScript();

        const expected = resolveColorMode(parseColorMode(stored), prefersLight);
        const label = `stored=${String(stored)} prefersLight=${String(prefersLight)}`;
        expect(
          document.documentElement.classList.contains("dark"),
          label,
        ).toBe(expected === "dark");
        expect(meta.getAttribute("content"), label).toBe(THEME_COLOR[expected]);
      }
    }
  });

  it("falls back to the default mode when localStorage throws", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("storage unavailable");
      },
    });
    const meta = installThemeMeta();
    meta.setAttribute("content", THEME_COLOR.dark);
    document.documentElement.className = "dark";
    runScript();

    // The read throws before any mutation, so the server default (dark)
    // stands and agrees with resolveColorMode's fallback.
    const expected = resolveColorMode(DEFAULT_COLOR_MODE, false);
    expect(document.documentElement.classList.contains("dark")).toBe(
      expected === "dark",
    );
    expect(meta.getAttribute("content")).toBe(THEME_COLOR[expected]);
  });
});
