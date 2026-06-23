/** PWA install prompt event (not in lib.dom by default). */
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const INSTALL_DISMISS_KEY = "nyx-fit-install-dismissed";
const DISMISS_DAYS = 7;

export function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isInstallPromptDismissed(): boolean {
  if (typeof localStorage === "undefined") return false;
  const raw = localStorage.getItem(INSTALL_DISMISS_KEY);
  if (!raw) return false;
  const dismissedAt = Number(raw);
  if (Number.isNaN(dismissedAt)) return false;
  const elapsed = Date.now() - dismissedAt;
  return elapsed < DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

export function dismissInstallPrompt(): void {
  localStorage.setItem(INSTALL_DISMISS_KEY, String(Date.now()));
}
