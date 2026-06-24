import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    const updateStatus = () => {
      setIsOffline(!navigator.onLine)
    }

    updateStatus()
    window.addEventListener('online', updateStatus)
    window.addEventListener('offline', updateStatus)

    return () => {
      window.removeEventListener('online', updateStatus)
      window.removeEventListener('offline', updateStatus)
    }
  }, [])

  if (!isOffline) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-[70] border-b border-orange-500/30 bg-zinc-950/95 px-4 py-2.5 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-lg items-center justify-center gap-2 text-sm text-zinc-100">
        <WifiOff className="h-4 w-4 shrink-0 text-orange-400" aria-hidden />
        <span>You&apos;re offline. Cached screens stay available.</span>
      </div>
    </div>
  )
}
