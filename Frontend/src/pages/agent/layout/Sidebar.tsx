"use client"

import type React from "react"
import { useRef, useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { HeadphonesIcon, TrendingUp, BarChart2 } from "lucide-react"

interface SidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
  isMobile?: boolean
  onItemClick?: () => void
}

interface NavItem {
  title: string
  icon: React.ElementType
  path: string
}

interface NavSection {
  label: string
  items: NavItem[]
}

const sections: NavSection[] = [
  {
    label: "SUPPORT",
    items: [
      { title: "Support Portal", icon: HeadphonesIcon, path: "/agent/support/portal" },
    ],
  },
]

export default function Sidebar({ open, isMobile = false, onItemClick }: SidebarProps) {
  const location = useLocation()
  const [isHoveringCollapsed, setIsHoveringCollapsed] = useState(false)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const shouldShowExpanded = open || isMobile || (!isMobile && !open && isHoveringCollapsed)

  const handleSidebarMouseEnter = () => {
    if (!isMobile && !open) {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = setTimeout(() => setIsHoveringCollapsed(true), 60)
    }
  }
  const handleSidebarMouseLeave = () => {
    if (!isMobile && !open) {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = setTimeout(() => setIsHoveringCollapsed(false), 160)
    }
  }

  useEffect(() => () => { if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current) }, [])

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path)
  const handleItemClick = () => { if (onItemClick) onItemClick() }

  return (
    <aside
      className={`
        ${isMobile
          ? `fixed left-0 top-0 z-50 h-full w-64 transform transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "-translate-x-full"}`
          : `${shouldShowExpanded ? "w-64" : "w-[70px]"} transition-all duration-300 ease-in-out`
        }
        flex flex-col flex-shrink-0 h-full overflow-hidden
      `}
      style={{ backgroundColor: "var(--theme-bg-sidebar)", borderRight: "1px solid var(--theme-border)" }}
      onMouseEnter={handleSidebarMouseEnter}
      onMouseLeave={handleSidebarMouseLeave}
    >
      {/* Logo */}
      <div className="flex h-16 items-center px-4 flex-shrink-0" style={{ borderBottom: "1px solid var(--theme-border)" }}>
        {shouldShowExpanded ? (
          <img src="/logo-removebg.png" alt={import.meta.env.VITE_SITE_NAME + " Logo"} className="h-10 object-contain" />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl shadow-lg" style={{ background: "var(--theme-primary)" }}>
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 scrollbar-hidden">
        {sections.map((section) => (
          <div key={section.label} className="mb-1">
            {shouldShowExpanded ? (
              <p className="px-4 pt-3 pb-1 text-[10px] font-semibold tracking-widest" style={{ color: "var(--theme-text-disabled)" }}>{section.label}</p>
            ) : (
              <div className="mx-auto my-1 h-px w-8" style={{ background: "var(--theme-border)" }} />
            )}
            {section.items.map((item) => {
              const active = isActive(item.path)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={handleItemClick}
                  title={!shouldShowExpanded ? item.title : undefined}
                  className="relative flex items-center gap-3 mx-2 my-0.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group"
                  style={{
                    backgroundColor: active ? "color-mix(in srgb, var(--theme-primary) 15%, transparent)" : undefined,
                    color: active ? "var(--theme-primary)" : "var(--theme-text-muted)",
                    borderLeft: active ? "3px solid var(--theme-primary)" : "3px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = "color-mix(in srgb, var(--theme-primary) 8%, transparent)"
                      ;(e.currentTarget as HTMLElement).style.color = "var(--theme-primary)"
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = ""
                      ;(e.currentTarget as HTMLElement).style.color = "var(--theme-text-muted)"
                    }
                  }}
                >
                  <item.icon className="flex-shrink-0 group-hover:scale-110 transition-transform duration-200" style={{ width: 17, height: 17 }} />
                  <span className={`whitespace-nowrap transition-all duration-300 ${shouldShowExpanded ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"}`}>{item.title}</span>
                  {active && <span className="absolute right-2 h-1.5 w-1.5 rounded-full" style={{ background: "var(--theme-primary)" }} />}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {shouldShowExpanded && (
        <div className="flex-shrink-0 px-4 py-3" style={{ borderTop: "1px solid var(--theme-border)" }}>
          <div className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4" style={{ color: "var(--theme-primary)" }} />
            <span className="text-xs font-semibold" style={{ color: "var(--theme-text-disabled)" }}>Agent Portal</span>
          </div>
        </div>
      )}
    </aside>
  )
}
