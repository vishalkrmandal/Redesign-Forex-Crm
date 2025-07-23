import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark"
type UserRole = "client" | "agent" | "admin" | "superadmin"

interface User {
  id: string
  firstname: string
  lastname: string
  email: string
  isEmailVerified: boolean
  role: UserRole
}

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  canToggleTheme: boolean
  userRole: UserRole | null
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Get user data from localStorage
  const getUserFromStorage = (): User | null => {
    try {
      // Check for different user types based on your auth system
      const adminUser = localStorage.getItem("adminUser")
      const clientUser = localStorage.getItem("clientUser")
      const agentUser = localStorage.getItem("agentUser")
      const superadminUser = localStorage.getItem("superadminUser")

      // Return the first available user (priority order)
      if (superadminUser) return JSON.parse(superadminUser)
      if (adminUser) return JSON.parse(adminUser)
      if (agentUser) return JSON.parse(agentUser)
      if (clientUser) return JSON.parse(clientUser)

      return null
    } catch (error) {
      console.error("Error parsing user data from localStorage:", error)
      return null
    }
  }

  // Initialize user role immediately
  const initialUser = getUserFromStorage()
  const initialRole = initialUser?.role || null

  const [userRole, setUserRole] = useState<UserRole | null>(initialRole)
  const [canToggleTheme, setCanToggleTheme] = useState(initialRole === "admin" || initialRole === "superadmin")

  // Initialize theme based on user role
  const [theme, setTheme] = useState<Theme>(() => {
    // Force light mode for client and agent roles
    if (initialRole === "client" || initialRole === "agent") {
      return "light"
    }

    // For admin and superadmin users, check saved preference or system preference
    if (initialRole === "admin" || initialRole === "superadmin") {
      const savedTheme = localStorage.getItem("theme") as Theme | null
      if (savedTheme && (savedTheme === "light" || savedTheme === "dark")) {
        return savedTheme
      }
      const systemPreference = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      return systemPreference
    }

    // Default to light if no user data
    return "light"
  })

  // Update theme permissions when user role changes
  useEffect(() => {
    const user = getUserFromStorage()
    const role = user?.role || null

    console.log("User role detected:", role) // Debug log

    setUserRole(role)
    setCanToggleTheme(role === "admin" || role === "superadmin")

    // Force light theme for client and agent, but don't override admin/superadmin theme
    if (role === "client" || role === "agent") {
      setTheme("light")
    }
  }, [])

  // Listen for changes in localStorage (in case user data changes)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (["adminUser", "clientUser", "agentUser", "superadminUser"].includes(e.key || "")) {
        const user = getUserFromStorage()
        const role = user?.role || null

        console.log("Storage change detected, new role:", role) // Debug log

        setUserRole(role)
        setCanToggleTheme(role === "admin" || role === "superadmin")

        // Force light theme for client and agent
        if (role === "client" || role === "agent") {
          setTheme("light")
        }
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  // Apply theme to document and save preference
  useEffect(() => {
    // Update class on document element when theme changes
    const root = window.document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(theme)

    // Only save theme preference for admin and superadmin users
    if (userRole === "admin" || userRole === "superadmin") {
      localStorage.setItem("theme", theme)
    }
  }, [theme, userRole])

  const toggleTheme = () => {
    console.log("Toggle theme called, canToggleTheme:", canToggleTheme, "userRole:", userRole) // Debug log

    // Only allow theme toggle for admin and superadmin users
    if ((userRole === "admin" || userRole === "superadmin") && canToggleTheme) {
      setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"))
    } else {
      console.warn("Theme toggle is only available for admin and superadmin users. Current role:", userRole)
    }
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        canToggleTheme,
        userRole
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}