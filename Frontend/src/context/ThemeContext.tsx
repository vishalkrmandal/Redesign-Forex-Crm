// Frontend/src/context/ThemeContext.tsx
import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"

type Theme = "dark"
type UserRole = "client" | "agent" | "admin" | "superadmin"

interface User {
  id: string
  firstname: string
  lastname: string
  email: string
  isEmailVerified: boolean
  role: UserRole
}

export interface ThemeColors {
  primaryColor:  string
  primaryHover:  string
  highlight:     string
  bgMain:        string
  bgSidebar:     string
  bgCard:        string
  textPrimary:   string
  textMuted:     string
  textDisabled:  string
  success:       string
  danger:        string
  warning:       string
  info:          string
  borderColor:   string
}

interface ThemeContextType {
  theme:          Theme
  toggleTheme:    () => void
  canToggleTheme: boolean
  userRole:       UserRole | null
  themeColors:    ThemeColors
  setTheme:       (colors: ThemeColors) => void
}

export const DEFAULT_COLORS: ThemeColors = {
  primaryColor:  '#3B82F6',
  primaryHover:  '#2563EB',
  highlight:     '#F59E0B',
  bgMain:        '#0F1117',
  bgSidebar:     '#111315',
  bgCard:        '#1A1D23',
  textPrimary:   '#FFFFFF',
  textMuted:     '#9CA3AF',
  textDisabled:  '#6B7280',
  success:       '#10B981',
  danger:        '#EF4444',
  warning:       '#F59E0B',
  info:          '#3B82F6',
  borderColor:   '#374151',
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

/** Convert #RRGGBB → "H S% L%" triplet (shadcn/Tailwind HSL format) */
function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0, s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

/** Inject (or replace) a <style> tag that overrides hardcoded Tailwind classes */
function injectOverrideStyle(c: ThemeColors) {
  const ID = 'crm-theme-override'
  let el = document.getElementById(ID) as HTMLStyleElement | null
  if (!el) {
    el = document.createElement('style')
    el.id = ID
    document.head.appendChild(el)
  }
  el.textContent = `

    /* ══════════════════════════════════════════════
       BACKGROUNDS
    ══════════════════════════════════════════════ */
    aside { background-color: ${c.bgSidebar} !important; }
    header { background-color: ${c.bgSidebar} !important;
             border-bottom-color: ${c.borderColor} !important; }
    main { background-color: ${c.bgMain} !important; }
    .dark .animate-blob { opacity: 0.06 !important; }
    .dark .bg-card, [class*="bg-card"] { background-color: ${c.bgCard} !important; }
    .dark .bg-background { background-color: ${c.bgMain} !important; }

    /* Gradient card overrides — components using from-gray-* / to-gray-* */
    .dark [class*="from-gray-900"],
    .dark [class*="from-gray-800"] { --tw-gradient-from: ${c.bgCard} !important; }
    .dark [class*="to-gray-800"],
    .dark [class*="to-gray-750"],
    .dark [class*="to-gray-700"] { --tw-gradient-to: ${c.bgCard} !important; }
    .dark [class*="from-white"],
    .dark [class*="to-gray-50"] { --tw-gradient-from: ${c.bgCard} !important;
                                  --tw-gradient-to: ${c.bgCard} !important; }

    /* Component card backgrounds (bg-white, bg-gray-800, etc.) */
    .dark .bg-white { background-color: ${c.bgCard} !important; }
    .dark .bg-gray-800 { background-color: ${c.bgCard} !important; }
    .dark .bg-gray-900 { background-color: ${c.bgMain} !important; }

    /* ══════════════════════════════════════════════
       TEXT COLORS
       Maps hardcoded Tailwind dark:text-gray-* to theme tokens
    ══════════════════════════════════════════════ */
    .dark .text-white,
    .dark .text-gray-50,
    .dark .text-gray-100,
    .dark .text-gray-200,
    .dark .text-gray-900,
    .dark .text-slate-100,
    .dark .text-slate-200 { color: ${c.textPrimary} !important; }

    .dark .text-gray-300,
    .dark .text-gray-400,
    .dark .text-slate-300,
    .dark .text-slate-400 { color: ${c.textMuted} !important; }

    .dark .text-gray-500,
    .dark .text-gray-600,
    .dark .text-gray-700,
    .dark .text-slate-500,
    .dark .text-slate-600 { color: ${c.textDisabled} !important; }

    /* ══════════════════════════════════════════════
       STATUS — TEXT
    ══════════════════════════════════════════════ */
    .dark .text-green-400,
    .dark .text-green-500,
    .dark .text-green-600 { color: ${c.success} !important; }

    .dark .text-red-400,
    .dark .text-red-500,
    .dark .text-red-600 { color: ${c.danger} !important; }

    .dark .text-yellow-400,
    .dark .text-yellow-500,
    .dark .text-amber-400,
    .dark .text-amber-500,
    .dark .text-amber-600 { color: ${c.warning} !important; }

    .dark .text-blue-400,
    .dark .text-blue-500,
    .dark .text-blue-600,
    .dark .text-indigo-400,
    .dark .text-indigo-500 { color: ${c.info} !important; }

    .dark .text-purple-400,
    .dark .text-purple-500 { color: ${c.highlight} !important; }

    /* ══════════════════════════════════════════════
       STATUS — BACKGROUNDS (progress bars, badges, icons)
    ══════════════════════════════════════════════ */
    .bg-green-500,
    .dark .bg-green-500 { background-color: ${c.success} !important; }

    .bg-red-500,
    .dark .bg-red-500 { background-color: ${c.danger} !important; }

    .bg-yellow-500, .bg-amber-500,
    .dark .bg-yellow-500, .dark .bg-amber-500 { background-color: ${c.warning} !important; }

    .dark .bg-green-900\\/20,
    .dark .bg-green-100 { background-color: ${c.success}22 !important; }

    .dark .bg-red-900\\/20,
    .dark .bg-red-100 { background-color: ${c.danger}22 !important; }

    .dark .bg-yellow-100,
    .dark .bg-yellow-900\\/20,
    .dark .bg-amber-900\\/20 { background-color: ${c.warning}22 !important; }

    .dark .bg-blue-900\\/20,
    .dark .bg-blue-100,
    .dark .bg-indigo-50,
    .dark .bg-indigo-100,
    .dark .bg-indigo-900\\/20 { background-color: ${c.info}22 !important; }

    .dark .bg-purple-900\\/20,
    .dark .bg-purple-100 { background-color: ${c.highlight}22 !important; }

    /* ══════════════════════════════════════════════
       BRAND / PRIMARY — BACKGROUNDS + HOVER
    ══════════════════════════════════════════════ */
    .dark .bg-blue-500,
    .dark .bg-blue-600 { background-color: ${c.primaryColor} !important; }

    .dark .bg-blue-700,
    .dark .hover\\:bg-blue-700:hover { background-color: ${c.primaryHover} !important; }

    .dark .bg-indigo-500,
    .dark .bg-indigo-600 { background-color: ${c.primaryColor} !important; }

    .dark .bg-blue-50 { background-color: ${c.primaryColor}18 !important; }

    /* ══════════════════════════════════════════════
       HIGHLIGHT / ACCENT
    ══════════════════════════════════════════════ */
    .dark .text-accent,
    .dark .bg-accent { color: ${c.highlight} !important; }
    .dark .bg-purple-500,
    .dark .bg-purple-600 { background-color: ${c.highlight} !important; }
    .dark .bg-pink-500,
    .dark .bg-pink-600 { background-color: ${c.highlight} !important; }

    /* ══════════════════════════════════════════════
       BORDERS
    ══════════════════════════════════════════════ */
    .dark .border-gray-700,
    .dark .border-gray-600,
    .dark .border-gray-800,
    .dark .border-slate-700,
    .dark .border-slate-600 { border-color: ${c.borderColor} !important; }

    .dark .border-gray-100,
    .dark .border-gray-200 { border-color: ${c.borderColor}55 !important; }

    /* Status border-left colours (for stat cards) */
    .dark .border-green-500 { border-color: ${c.success} !important; }
    .dark .border-red-500   { border-color: ${c.danger}  !important; }
    .dark .border-yellow-500,
    .dark .border-amber-500 { border-color: ${c.warning} !important; }
    .dark .border-blue-500  { border-color: ${c.info}    !important; }
    .dark .border-purple-500{ border-color: ${c.highlight}!important; }

    /* ══════════════════════════════════════════════
       MISC DARK BG OVERRIDES
       (progress track, hover surfaces, etc.)
    ══════════════════════════════════════════════ */
    .dark .bg-gray-700 { background-color: ${c.borderColor}66 !important; }
    .dark .bg-gray-200 { background-color: ${c.borderColor}33 !important; }

    .dark .hover\\:bg-gray-800:hover,
    .dark .hover\\:bg-gray-700:hover,
    .dark .hover\\:bg-gray-600:hover { background-color: ${c.bgCard} !important; }

    /* Focus ring */
    .dark .focus\\:ring-blue-500:focus { --tw-ring-color: ${c.primaryColor}66 !important; }

    /* ══════════════════════════════════════════════
       SIDEBAR ACTIVE ITEM
    ══════════════════════════════════════════════ */
    .dark aside .bg-gray-700,
    .dark aside .bg-gray-200 { background-color: ${c.primaryColor}2a !important; }

    .dark aside .text-gray-100,
    .dark aside .font-semibold.text-gray-100 { color: ${c.primaryColor} !important; }

    /* ══════════════════════════════════════════════
       CHART / RECHARTS OVERRIDES
    ══════════════════════════════════════════════ */
    .dark .recharts-cartesian-grid line { stroke: ${c.borderColor}44 !important; }
    .dark .recharts-text { fill: ${c.textDisabled} !important; }
    .dark .recharts-legend-item-text { color: ${c.textMuted} !important; }
    .dark .recharts-tooltip-wrapper .recharts-default-tooltip {
      background-color: ${c.bgCard} !important;
      border-color: ${c.borderColor} !important;
    }
  `
}

export function applyThemeVars(c: ThemeColors) {
  const r = document.documentElement

  // 1. Custom --theme-* vars (for new components using var())
  r.style.setProperty('--theme-primary',        c.primaryColor)
  r.style.setProperty('--theme-primary-hover',  c.primaryHover)
  r.style.setProperty('--theme-highlight',      c.highlight)
  r.style.setProperty('--theme-bg-main',        c.bgMain)
  r.style.setProperty('--theme-bg-sidebar',     c.bgSidebar)
  r.style.setProperty('--theme-bg-card',        c.bgCard)
  r.style.setProperty('--theme-text-primary',   c.textPrimary)
  r.style.setProperty('--theme-text-muted',     c.textMuted)
  r.style.setProperty('--theme-text-disabled',  c.textDisabled)
  r.style.setProperty('--theme-success',        c.success)
  r.style.setProperty('--theme-danger',         c.danger)
  r.style.setProperty('--theme-warning',        c.warning)
  r.style.setProperty('--theme-info',           c.info)
  r.style.setProperty('--theme-border',         c.borderColor)

  // 2. Shadcn/Tailwind HSL vars — used by bg-background, bg-card, text-foreground, etc.
  r.style.setProperty('--background',           hexToHsl(c.bgMain))
  r.style.setProperty('--foreground',           hexToHsl(c.textPrimary))
  r.style.setProperty('--card',                 hexToHsl(c.bgCard))
  r.style.setProperty('--card-foreground',      hexToHsl(c.textPrimary))
  r.style.setProperty('--popover',              hexToHsl(c.bgCard))
  r.style.setProperty('--popover-foreground',   hexToHsl(c.textPrimary))
  r.style.setProperty('--primary',              hexToHsl(c.primaryColor))
  r.style.setProperty('--primary-foreground',   hexToHsl(c.bgMain))
  r.style.setProperty('--secondary',            hexToHsl(c.bgSidebar))
  r.style.setProperty('--secondary-foreground', hexToHsl(c.textMuted))
  r.style.setProperty('--muted',                hexToHsl(c.bgCard))
  r.style.setProperty('--muted-foreground',     hexToHsl(c.textMuted))
  r.style.setProperty('--accent',               hexToHsl(c.highlight))
  r.style.setProperty('--accent-foreground',    hexToHsl(c.bgMain))
  r.style.setProperty('--border',               hexToHsl(c.borderColor))
  r.style.setProperty('--input',                hexToHsl(c.bgCard))
  r.style.setProperty('--destructive',          hexToHsl(c.danger))
  r.style.setProperty('--destructive-foreground', '0 0% 100%')
  r.style.setProperty('--success',              hexToHsl(c.success))
  r.style.setProperty('--warning',              hexToHsl(c.warning))
  r.style.setProperty('--ring',                 hexToHsl(c.primaryColor))

  // 3. Inject overrides for hardcoded Tailwind classes (gradients, sidebars, etc.)
  injectOverrideStyle(c)
}

function getUserRole(): UserRole | null {
  try {
    const keys = ['superadminUser', 'adminUser', 'agentUser', 'clientUser'] as const
    for (const k of keys) {
      const raw = localStorage.getItem(k)
      if (raw) {
        const parsed = JSON.parse(raw) as User
        return parsed.role ?? null
      }
    }
  } catch {
    // ignore
  }
  return null
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [userRole,    setUserRole]    = useState<UserRole | null>(getUserRole)
  const [themeColors, setThemeColors] = useState<ThemeColors>(DEFAULT_COLORS)

  const theme: Theme    = "dark"
  const canToggleTheme  = false
  const toggleTheme     = () => {}

  const setTheme = useCallback((colors: ThemeColors) => {
    setThemeColors(colors)
    applyThemeVars(colors)
  }, [])

  const fetchAndApply = useCallback(async () => {
    try {
      const res  = await fetch(`${API_BASE}/api/theme`)
      const json = await res.json()
      if (json.success && json.data) {
        const colors: ThemeColors = { ...DEFAULT_COLORS, ...json.data }
        setThemeColors(colors)
        applyThemeVars(colors)
      }
    } catch {
      applyThemeVars(DEFAULT_COLORS)
    }
  }, [])

  // On mount — lock to dark, fetch theme
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove("light")
    root.classList.add("dark")
    localStorage.removeItem("theme")
    fetchAndApply()
  }, [fetchAndApply])

  // Re-apply theme and sync role on login / logout
  useEffect(() => {
    const handle = (e: StorageEvent) => {
      if (['adminUser', 'clientUser', 'agentUser', 'superadminUser'].includes(e.key ?? '')) {
        setUserRole(getUserRole())
        fetchAndApply()
      }
    }
    window.addEventListener('storage', handle)
    return () => window.removeEventListener('storage', handle)
  }, [fetchAndApply])

  return (
    <ThemeContext.Provider
      value={{ theme, toggleTheme, canToggleTheme, userRole, themeColors, setTheme }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider")
  return ctx
}
