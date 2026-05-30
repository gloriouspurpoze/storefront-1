import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'

type ThemeVariant = 'light' | 'dark'

interface ThemeContextType {
  theme: ThemeVariant
  isDarkMode: boolean
  toggleTheme: () => void
  setTheme: (theme: ThemeVariant) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeVariant>(() => {
    // Check localStorage for saved theme preference
    const savedTheme = localStorage.getItem('theme') as ThemeVariant
    return savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : 'light'
  })

  const isDarkMode = theme === 'dark'

  const toggleTheme = () => {
    const newTheme = isDarkMode ? 'light' : 'dark'
    setTheme(newTheme)
  }

  const setTheme = (newTheme: ThemeVariant) => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  // Apply theme to document for Tailwind dark mode
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    
    // Add/remove 'dark' class for Tailwind
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme, isDarkMode])

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// NOTE: `useThemeColors` was removed in the DESIGN.md cleanup pass.
// DESIGN.md is the single source of truth for colors — consume them via:
//   - Tailwind classes:  bg-primary, text-ink, bg-cloud, border-hairline, …
//   - CSS variables:     var(--color-primary), var(--color-ink), …
// If you need a theme-aware color in JS, read the CSS var off
// `getComputedStyle(document.documentElement)` rather than hardcoding hex.

export type { ThemeVariant }
