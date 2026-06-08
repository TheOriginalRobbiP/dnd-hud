import { createContext, useContext, useEffect, ReactNode } from 'react'
import type { Campaign } from '../../types'

interface ThemeContextType {
  campaign: Campaign | null | undefined
}

const ThemeContext = createContext<ThemeContextType>({ campaign: null })

export function useTheme() {
  return useContext(ThemeContext)
}

interface ThemeProviderProps {
  campaign: Campaign | null | undefined
  children: ReactNode
}

export function ThemeProvider({ campaign, children }: ThemeProviderProps) {
  useEffect(() => {
    const root = document.documentElement
    
    // Extract color tokens with default fallbacks
    const canvas = campaign?.themeConfig?.canvas || '#0d0d0f'
    const surface = campaign?.themeConfig?.surface || '#161619'
    const border = campaign?.themeConfig?.border || '#2a2a2e'
    const primary = campaign?.themeConfig?.primary || '#f59e0b'
    const accent = campaign?.themeConfig?.accent || '#FFB800'

    // Set CSS properties on root element dynamically at runtime
    root.style.setProperty('--theme-canvas', canvas)
    root.style.setProperty('--theme-surface', surface)
    root.style.setProperty('--theme-border', border)
    root.style.setProperty('--theme-primary', primary)
    root.style.setProperty('--theme-accent', accent)

  }, [campaign])

  return (
    <ThemeContext.Provider value={{ campaign }}>
      {children}
    </ThemeContext.Provider>
  )
}
