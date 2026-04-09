"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { useNotifications } from "@/context/NotificationContext"
import { Menu, Search, LogOut, Shield, ChevronDown, X, Bell, Clock, Headphones } from "lucide-react"
import NotificationDropdown from "@/components/notifications/NotificationDropdown"

interface HeaderProps {
  toggleSidebar: () => void
  sidebarOpen: boolean
  isMobile: boolean
}

interface SearchPage {
  label: string
  path: string
  section: string
  icon: React.ElementType
}

const PAGES: SearchPage[] = [
  { label: "Support Portal", path: "/agent/support/portal", section: "Support", icon: Headphones },
]

export default function Header({ toggleSidebar, isMobile }: HeaderProps) {
  const { user, logout, activeRole } = useAuth()
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, loading, isConnected } = useNotifications()
  const navigate = useNavigate()
  const location = useLocation()

  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [userData, setUserData] = useState({ firstname: "Agent", lastname: "User", email: "agent@example.com" })

  const notificationRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  const pageTitle = location.pathname.includes("support") ? "Support Portal" : "Agent Portal"

  const searchResults = searchQuery.trim()
    ? PAGES.filter((p) => {
        const q = searchQuery.toLowerCase()
        return p.label.toLowerCase().includes(q) || p.section.toLowerCase().includes(q)
      })
    : []

  useEffect(() => { if (user) setUserData({ firstname: user.firstname || "Agent", lastname: user.lastname || "User", email: user.email || "agent@example.com" }) }, [user])
  useEffect(() => { const t = setInterval(() => setCurrentTime(new Date()), 1000); return () => clearInterval(t) }, [])
  useEffect(() => { setSelectedIndex(-1) }, [searchQuery])

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) setShowNotifications(false)
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false)
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSearch(false)
        setSearchQuery("")
        setSelectedIndex(-1)
      }
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  useEffect(() => { if (showSearch && searchRef.current) searchRef.current.focus() }, [showSearch])

  const handleResultClick = (path: string) => {
    navigate(path)
    setShowSearch(false)
    setSearchQuery("")
    setSelectedIndex(-1)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchResults.length > 0) {
      const target = selectedIndex >= 0 ? searchResults[selectedIndex] : searchResults[0]
      handleResultClick(target.path)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, searchResults.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === "Escape") {
      setShowSearch(false)
      setSearchQuery("")
      setSelectedIndex(-1)
    }
  }

  const handleLogout = () => { logout(activeRole ?? undefined, navigate); setShowUserMenu(false) }
  const getInitials = () => `${userData.firstname.charAt(0)}${userData.lastname.charAt(0)}`.toUpperCase()
  const formatTime = (d: Date) => d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
  const formatDate = (d: Date) => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })

  return (
    <header
      className="sticky top-0 z-30 flex h-16 items-center justify-between px-4 backdrop-blur-xl"
      style={{ backgroundColor: "color-mix(in srgb, var(--theme-bg-sidebar) 95%, transparent)", borderBottom: "1px solid var(--theme-border)" }}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-2 transition-all duration-200 active:scale-95"
          style={{ color: "var(--theme-text-muted)" }}
          onMouseEnter={(e) => { ;(e.currentTarget as HTMLElement).style.backgroundColor = "color-mix(in srgb, var(--theme-primary) 10%, transparent)"; ;(e.currentTarget as HTMLElement).style.color = "var(--theme-primary)" }}
          onMouseLeave={(e) => { ;(e.currentTarget as HTMLElement).style.backgroundColor = ""; ;(e.currentTarget as HTMLElement).style.color = "var(--theme-text-muted)" }}
        >
          <Menu className="h-5 w-5" />
        </button>
        {!isMobile && (
          <div className="hidden md:flex items-center gap-2">
            <span className="text-xs" style={{ color: "var(--theme-text-disabled)" }}>Agent</span>
            <span style={{ color: "var(--theme-border)" }}>/</span>
            <span className="text-sm font-semibold" style={{ color: "var(--theme-text-primary)" }}>{pageTitle}</span>
          </div>
        )}
      </div>

      {/* Center — Search */}
      <div ref={searchContainerRef} className="relative flex-1 max-w-sm mx-4 hidden md:block">
        {showSearch ? (
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--theme-text-disabled)" }} />
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search pages…"
              className="w-full rounded-lg px-4 py-2 pl-9 pr-9 text-sm outline-none"
              style={{ backgroundColor: "var(--theme-bg-card)", border: "1px solid var(--theme-primary)", color: "var(--theme-text-primary)" }}
            />
            <button type="button" onClick={() => { setShowSearch(false); setSearchQuery(""); setSelectedIndex(-1) }} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--theme-text-muted)" }}>
              <X className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <button
            onClick={() => setShowSearch(true)}
            className="flex w-full items-center rounded-lg px-4 py-2 text-sm"
            style={{ backgroundColor: "var(--theme-bg-card)", border: "1px solid var(--theme-border)", color: "var(--theme-text-disabled)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--theme-primary)" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--theme-border)" }}
          >
            <Search className="mr-2 h-4 w-4" />
            <span>Search pages…</span>
          </button>
        )}

        {/* Results Dropdown */}
        {showSearch && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 rounded-xl shadow-2xl z-50 overflow-hidden" style={{ backgroundColor: "var(--theme-bg-card)", border: "1px solid var(--theme-border)" }}>
            <div className="max-h-72 overflow-y-auto">
              {searchResults.map((page, idx) => {
                const Icon = page.icon
                const isSelected = idx === selectedIndex
                return (
                  <button
                    key={page.path}
                    onClick={() => handleResultClick(page.path)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 transition-colors duration-100"
                    style={{ backgroundColor: isSelected ? "color-mix(in srgb, var(--theme-primary) 12%, transparent)" : "transparent", borderLeft: isSelected ? "3px solid var(--theme-primary)" : "3px solid transparent" }}
                  >
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: "color-mix(in srgb, var(--theme-primary) 12%, transparent)" }}>
                      <Icon className="h-3.5 w-3.5" style={{ color: "var(--theme-primary)" }} />
                    </div>
                    <p className="text-sm font-medium truncate flex-1 text-left" style={{ color: isSelected ? "var(--theme-primary)" : "var(--theme-text-primary)" }}>{page.label}</p>
                    <span className="text-[10px] rounded-full px-2 py-0.5 font-medium" style={{ color: "var(--theme-text-muted)", backgroundColor: "color-mix(in srgb, var(--theme-text-muted) 10%, transparent)" }}>{page.section}</span>
                  </button>
                )
              })}
            </div>
            <div className="px-4 py-1.5" style={{ borderTop: "1px solid var(--theme-border)" }}>
              <span className="text-[10px]" style={{ color: "var(--theme-text-disabled)" }}>↑↓ navigate · Enter select · Esc close</span>
            </div>
          </div>
        )}

        {showSearch && searchQuery.trim() && searchResults.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 rounded-xl shadow-2xl z-50 px-4 py-6 text-center" style={{ backgroundColor: "var(--theme-bg-card)", border: "1px solid var(--theme-border)" }}>
            <p className="text-sm" style={{ color: "var(--theme-text-muted)" }}>No pages found for "{searchQuery}"</p>
          </div>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <button onClick={() => setShowSearch(true)} className="md:hidden rounded-lg p-2" style={{ color: "var(--theme-text-muted)" }}><Search className="h-5 w-5" /></button>

        {!isMobile && (
          <div className="hidden lg:flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs" style={{ backgroundColor: "var(--theme-bg-card)", border: "1px solid var(--theme-border)", color: "var(--theme-text-muted)" }}>
            <Clock className="h-3.5 w-3.5" style={{ color: "var(--theme-primary)" }} />
            <span className="font-mono font-medium" style={{ color: "var(--theme-text-primary)" }}>{formatTime(currentTime)}</span>
            <span>{formatDate(currentTime)}</span>
          </div>
        )}

        <div className="relative" ref={notificationRef}>
          <button onClick={() => { setShowNotifications((v) => !v); setShowUserMenu(false) }} className="relative rounded-lg p-2" style={{ color: "var(--theme-text-muted)" }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--theme-primary)" }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--theme-text-muted)" }}>
            <Bell className={`h-5 w-5 ${!isConnected ? "opacity-50" : ""}`} />
            {unreadCount > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: "var(--theme-danger)" }}>{unreadCount > 9 ? "9+" : unreadCount}</span>}
          </button>
          {showNotifications && <NotificationDropdown notifications={notifications} onClose={() => setShowNotifications(false)} onMarkAsRead={markAsRead} onMarkAllAsRead={markAllAsRead} onDeleteNotification={deleteNotification} loading={loading} unreadCount={unreadCount} />}
        </div>

        <div className="relative" ref={userMenuRef}>
          <button onClick={() => { setShowUserMenu((v) => !v); setShowNotifications(false) }} className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-all duration-200" onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "color-mix(in srgb, var(--theme-primary) 8%, transparent)" }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "" }}>
            <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white shadow-md" style={{ background: "linear-gradient(135deg, var(--theme-primary), var(--theme-primary-hover))" }}>{getInitials()}</div>
            {!isMobile && (
              <>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-semibold leading-tight" style={{ color: "var(--theme-text-primary)" }}>{userData.firstname} {userData.lastname}</p>
                  <p className="text-[10px]" style={{ color: "var(--theme-text-disabled)" }}>Agent</p>
                </div>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showUserMenu ? "rotate-180" : ""}`} style={{ color: "var(--theme-text-muted)" }} />
              </>
            )}
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-64 rounded-xl shadow-2xl overflow-hidden z-50" style={{ backgroundColor: "var(--theme-bg-card)", border: "1px solid var(--theme-border)" }}>
              <div className="flex items-center gap-3 p-4" style={{ borderBottom: "1px solid var(--theme-border)" }}>
                <div className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white flex-shrink-0" style={{ background: "linear-gradient(135deg, var(--theme-primary), var(--theme-primary-hover))" }}>{getInitials()}</div>
                <div className="min-w-0">
                  <h3 className="font-semibold truncate" style={{ color: "var(--theme-text-primary)" }}>{userData.firstname} {userData.lastname}</h3>
                  <p className="text-xs truncate" style={{ color: "var(--theme-text-muted)" }}>{userData.email}</p>
                  {activeRole && <div className="mt-1 flex items-center gap-1"><Shield className="h-3 w-3" style={{ color: "var(--theme-primary)" }} /><span className="text-xs font-medium capitalize" style={{ color: "var(--theme-primary)" }}>{activeRole}</span></div>}
                </div>
              </div>
              <div className="p-2">
                <MenuBtn icon={LogOut} label="Logout" onClick={handleLogout} danger />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {showSearch && isMobile && (
        <div className="fixed inset-0 z-50 flex flex-col items-start pt-4 px-4 backdrop-blur-sm" style={{ backgroundColor: "color-mix(in srgb, var(--theme-bg-main) 80%, transparent)" }}>
          <div className="flex w-full gap-3">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--theme-text-disabled)" }} />
                <input ref={searchRef} type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={handleKeyDown} placeholder="Search pages…" className="w-full rounded-lg px-4 py-3 pl-9 text-sm outline-none" style={{ backgroundColor: "var(--theme-bg-card)", border: "1px solid var(--theme-primary)", color: "var(--theme-text-primary)" }} />
              </div>
            </form>
            <button onClick={() => { setShowSearch(false); setSearchQuery(""); setSelectedIndex(-1) }} className="rounded-lg p-2" style={{ color: "var(--theme-text-muted)" }}><X className="h-5 w-5" /></button>
          </div>
          {searchResults.length > 0 && (
            <div className="mt-2 w-full rounded-xl overflow-hidden shadow-2xl" style={{ backgroundColor: "var(--theme-bg-card)", border: "1px solid var(--theme-border)" }}>
              {searchResults.map((page, idx) => {
                const Icon = page.icon
                const isSelected = idx === selectedIndex
                return (
                  <button key={page.path} onClick={() => handleResultClick(page.path)} className="flex w-full items-center gap-3 px-4 py-3 transition-colors duration-100" style={{ backgroundColor: isSelected ? "color-mix(in srgb, var(--theme-primary) 12%, transparent)" : "transparent", borderLeft: isSelected ? "3px solid var(--theme-primary)" : "3px solid transparent" }}>
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: "color-mix(in srgb, var(--theme-primary) 12%, transparent)" }}>
                      <Icon className="h-3.5 w-3.5" style={{ color: "var(--theme-primary)" }} />
                    </div>
                    <p className="text-sm font-medium truncate flex-1 text-left" style={{ color: isSelected ? "var(--theme-primary)" : "var(--theme-text-primary)" }}>{page.label}</p>
                    <span className="text-[10px] rounded-full px-2 py-0.5" style={{ color: "var(--theme-text-muted)", backgroundColor: "color-mix(in srgb, var(--theme-text-muted) 10%, transparent)" }}>{page.section}</span>
                  </button>
                )
              })}
            </div>
          )}
          {searchQuery.trim() && searchResults.length === 0 && (
            <div className="mt-2 w-full rounded-xl px-4 py-6 text-center" style={{ backgroundColor: "var(--theme-bg-card)", border: "1px solid var(--theme-border)" }}>
              <p className="text-sm" style={{ color: "var(--theme-text-muted)" }}>No pages found</p>
            </div>
          )}
        </div>
      )}
    </header>
  )
}

function MenuBtn({ icon: Icon, label, onClick, danger }: { icon: React.ElementType; label: string; onClick: () => void; danger?: boolean }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150" style={{ color: danger ? "var(--theme-danger)" : "var(--theme-text-muted)", backgroundColor: hovered ? (danger ? "color-mix(in srgb, var(--theme-danger) 10%, transparent)" : "color-mix(in srgb, var(--theme-primary) 8%, transparent)") : "transparent" }}>
      <Icon className="h-4 w-4" /><span>{label}</span>
    </button>
  )
}
