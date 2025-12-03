import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type FontTheme = 'night-runner' | 'powerhouse' | 'premium'

interface FontThemeContextValue {
  theme: FontTheme
  setTheme: (theme: FontTheme) => void
}

const FontThemeContext = createContext<FontThemeContextValue | undefined>(undefined)

const STORAGE_KEY = 'nyx-font-theme'

export function FontThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<FontTheme>('night-runner')

  useEffect(() => {
    // Load theme from localStorage
    const stored = localStorage.getItem(STORAGE_KEY) as FontTheme | null
    if (stored && ['night-runner', 'powerhouse', 'premium'].includes(stored)) {
      setThemeState(stored)
    }
  }, [])

  useEffect(() => {
    // Apply theme to document
    const body = document.body

    // Remove all theme attributes
    body.removeAttribute('data-font-theme')

    // Apply new theme (except for default night-runner)
    if (theme === 'powerhouse') {
      body.setAttribute('data-font-theme', 'powerhouse')
    } else if (theme === 'premium') {
      body.setAttribute('data-font-theme', 'premium')
    }

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const setTheme = (newTheme: FontTheme) => {
    setThemeState(newTheme)
  }

  return (
    <FontThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </FontThemeContext.Provider>
  )
}

export function useFontTheme() {
  const context = useContext(FontThemeContext)
  if (!context) {
    throw new Error('useFontTheme must be used within FontThemeProvider')
  }
  return context
}
