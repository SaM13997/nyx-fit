const INSTALL_DISMISS_KEY = 'nyx-fit-install-dismissed-until'

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function isStandaloneDisplayMode(): boolean {
  if (typeof window === 'undefined') return false

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator &&
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true)
  )
}

export function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false

  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

export function isInstallPromptDismissed(): boolean {
  if (typeof localStorage === 'undefined') return false

  const until = Number(localStorage.getItem(INSTALL_DISMISS_KEY) ?? 0)
  return Number.isFinite(until) && until > Date.now()
}

export function dismissInstallPrompt(days = 7): void {
  if (typeof localStorage === 'undefined') return

  const until = Date.now() + days * 24 * 60 * 60 * 1000
  localStorage.setItem(INSTALL_DISMISS_KEY, String(until))
}
