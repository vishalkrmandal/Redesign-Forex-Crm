// Frontend/src/pages/superAdmin/layout/Layout.tsx - Complete file with SessionIndicator

"use client"

import { useState, useEffect } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { Toaster } from 'react-hot-toast'
import Sidebar from "./Sidebar"
import Header from "./Header"
import { NotificationProvider } from "@/context/NotificationContext"
import ImpersonationBanner from '@/pages/auth/ImpersonationBanner'
import SessionIndicator from '@/components/SessionIndicator'

export default function SuperadminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const location = useLocation()

  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [hasDragged, setHasDragged] = useState(false)

  // Preserve scroll position and URL state on reload
  useEffect(() => {
    // Save current scroll position and URL to sessionStorage
    const saveState = () => {
      sessionStorage.setItem('scrollPosition', window.scrollY.toString())
      sessionStorage.setItem('currentPath', location.pathname)
    }

    // Restore state on mount
    const restoreState = () => {
      const savedScroll = sessionStorage.getItem('scrollPosition')

      if (savedScroll) {
        setTimeout(() => {
          window.scrollTo(0, parseInt(savedScroll))
        }, 100)
      }
    }

    // Add event listeners
    window.addEventListener('beforeunload', saveState)

    // Restore state on component mount
    restoreState()

    return () => {
      window.removeEventListener('beforeunload', saveState)
    }
  }, [location.pathname])

  // Handle responsive sidebar behavior
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)

      // Auto-adjust sidebar based on screen size
      if (mobile && sidebarOpen) {
        setSidebarOpen(false)
      } else if (!mobile && !sidebarOpen) {
        setSidebarOpen(true)
      }
    }

    // Set initial state
    const mobile = window.innerWidth < 768
    setIsMobile(mobile)
    setSidebarOpen(!mobile)

    // Add resize listener
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const closeSidebar = () => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setHasDragged(false)

    const rect = e.currentTarget.getBoundingClientRect()
    const offsetX = e.clientX - rect.left
    const offsetY = e.clientY - rect.top

    // Get reference to the element for direct DOM manipulation
    const dragElement = e.currentTarget as HTMLElement

    const handleMouseMove = (e: MouseEvent) => {
      setHasDragged(true)

      // Direct DOM manipulation for smoother dragging
      const newX = e.clientX - offsetX
      const newY = e.clientY - offsetY

      dragElement.style.left = `${newX}px`
      dragElement.style.top = `${newY}px`
      dragElement.style.transform = 'none'

      // Update state less frequently for performance
      requestAnimationFrame(() => {
        setDragPosition({ x: newX, y: newY })
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)

      setTimeout(() => setHasDragged(false), 50)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <NotificationProvider userType="superadmin">
      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: {
            background: 'var(--background)',
            color: 'var(--foreground)',
            border: '1px solid var(--border)',
          },
          success: {
            iconTheme: {
              primary: 'var(--primary)',
              secondary: 'var(--primary-foreground)',
            },
          },
          error: {
            iconTheme: {
              primary: 'var(--destructive)',
              secondary: 'var(--destructive-foreground)',
            },
          },
        }}
      />

      <div className="relative min-h-screen bg-background">
        <ImpersonationBanner />

        {/* Main layout container with background */}
        <div className="flex h-screen bg-background">
          {/* Mobile Overlay */}
          {isMobile && sidebarOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
              onClick={closeSidebar}
              aria-label="Close sidebar"
            />
          )}

          {/* Sidebar Container */}
          <div className={`${isMobile ? 'fixed z-50' : 'relative z-10'} transition-all duration-300 ease-in-out`}>
            <Sidebar
              open={sidebarOpen}
              setOpen={setSidebarOpen}
              isMobile={isMobile}
              onItemClick={closeSidebar}
            />
          </div>

          {/* Main Content Area */}
          <div className="flex flex-1 flex-col overflow-hidden bg-background">
            {/* Header */}
            <Header
              toggleSidebar={toggleSidebar}
              sidebarOpen={sidebarOpen}
              isMobile={isMobile}
            />

            {/* Main Content */}
            <main className="flex-1 overflow-auto relative bg-background">
              <div className="mx-auto p-2 max-w-7xl">
                <div className="min-h-full">
                  <Outlet />
                </div>
              </div>
            </main>

            {/* Session Indicator - Draggable */}
            <div
              className={`fixed z-[100] cursor-move select-none session-indicator-drag ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              style={{
                left: dragPosition.x || 'calc(100% - 200px)',
                top: dragPosition.y || '80px',
                transform: dragPosition.x ? 'none' : 'translateX(-100%)'
              }}
              onMouseDown={handleMouseDown}
              onClick={(e) => {
                if (hasDragged) {
                  e.stopPropagation()
                  e.preventDefault()
                }
              }}
            >
              <div style={{ pointerEvents: hasDragged ? 'none' : 'auto' }}>
                <SessionIndicator />
              </div>
            </div>
          </div>
        </div>
      </div>
    </NotificationProvider>
  )
}