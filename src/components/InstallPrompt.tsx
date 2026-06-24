import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Share, X } from 'lucide-react'
import {
  dismissInstallPrompt,
  isInstallPromptDismissed,
  isIosDevice,
  isStandaloneDisplayMode,
  type BeforeInstallPromptEvent,
} from '@/lib/pwa'

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [showIosHint, setShowIosHint] = useState(false)

  useEffect(() => {
    if (isStandaloneDisplayMode() || isInstallPromptDismissed()) return

    const handler = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
      setShowIosHint(false)
      setIsVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    if (isIosDevice()) {
      const timer = window.setTimeout(() => {
        setShowIosHint(true)
        setIsVisible(true)
      }, 2500)

      return () => {
        window.removeEventListener('beforeinstallprompt', handler)
        window.clearTimeout(timer)
      }
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setIsVisible(false)
    }

    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    dismissInstallPrompt()
    setIsVisible(false)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.98 }}
          transition={{ type: 'spring', damping: 22, stiffness: 320 }}
          className="fixed inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[60] mx-auto max-w-sm"
        >
          <div className="rounded-2xl border border-white/10 bg-zinc-900/95 p-4 shadow-2xl shadow-purple-950/30 backdrop-blur-md">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-purple-600">
                <Download className="h-5 w-5 text-white" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-white">
                  Install Nyx Fit
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                  {showIosHint && !deferredPrompt
                    ? 'Tap Share, then Add to Home Screen for the full app experience.'
                    : 'Install the app for faster launch and offline access to your training shell.'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleDismiss}
                className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
                aria-label="Dismiss install prompt"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 flex gap-3">
              {deferredPrompt ? (
                <button
                  type="button"
                  onClick={() => {
                    void handleInstallClick()
                  }}
                  className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-orange-400 active:scale-[0.98]"
                >
                  <Download className="h-4 w-4" aria-hidden />
                  Install App
                </button>
              ) : showIosHint ? (
                <div className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-2.5 text-sm font-medium text-purple-100">
                  <Share className="h-4 w-4 shrink-0 text-purple-300" aria-hidden />
                  Use browser Share menu
                </div>
              ) : null}
              <button
                type="button"
                onClick={handleDismiss}
                className="min-h-11 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
              >
                Not now
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
