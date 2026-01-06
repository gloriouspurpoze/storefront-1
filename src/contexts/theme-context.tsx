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

// Hook for getting theme-aware colors (Tailwind CSS variables)
export function useThemeColors() {
  const { isDarkMode } = useTheme()
  
  return {
    primary: isDarkMode ? '#3b82f6' : '#2563eb',
    secondary: isDarkMode ? '#8b5cf6' : '#7c3aed',
    success: isDarkMode ? '#10b981' : '#059669',
    error: isDarkMode ? '#ef4444' : '#dc2626',
    warning: isDarkMode ? '#f59e0b' : '#d97706',
    info: isDarkMode ? '#06b6d4' : '#0891b2',
    background: isDarkMode ? '#0f172a' : '#f8fafc',
    surface: isDarkMode ? '#1e293b' : '#ffffff',
    text: isDarkMode ? '#f8fafc' : '#0f172a',
    textSecondary: isDarkMode ? '#cbd5e1' : '#64748b',
  }
}

// Export type for convenience
export type { ThemeVariant }
