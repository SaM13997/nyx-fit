import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { useFontTheme, type FontTheme } from '@/components/FontThemeContext'
import { Check } from 'lucide-react'

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

function SettingsPage() {
  const { theme, setTheme } = useFontTheme()

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Customize your Nyx Fit experience</p>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Font Theme</h2>
        <div className="flex flex-col gap-3">
          {fontThemes.map((fontTheme) => {
            const isActive = theme === fontTheme.id

            return (
              <motion.button
                key={fontTheme.id}
                onClick={() => setTheme(fontTheme.id)}
                className="relative flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition-colors hover:bg-white/10"
                whileTap={{ scale: 0.98 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-font-theme"
                    className="absolute inset-0 rounded-2xl border-2 border-cyan-400/50 bg-cyan-400/10"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}

                <div className="relative flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{fontTheme.name}</h3>
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', bounce: 0.5 }}
                        >
                          <Check className="h-5 w-5 text-cyan-400" />
                        </motion.div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{fontTheme.description}</p>
                  </div>
                </div>

                <div className="relative mt-2 flex flex-col gap-1 rounded-lg bg-black/20 p-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs text-muted-foreground">Headings:</span>
                    <span className="text-sm font-semibold">{fontTheme.heading}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs text-muted-foreground">Body:</span>
                    <span className="text-sm">{fontTheme.body}</span>
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <h3 className="text-lg font-semibold mb-3">Preview</h3>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">Heading Example</h1>
          <p className="text-base">
            This is body text. The quick brown fox jumps over the lazy dog.
          </p>
        </div>
      </div>
    </div>
  )
}
