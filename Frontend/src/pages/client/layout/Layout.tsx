// Frontend/src/pages/client/layout/Layout.tsx - Complete file with SessionIndicator

"use client"

import { useState, useEffect } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { Toaster } from 'react-hot-toast'
import Sidebar from "./Sidebar"
import Header from "./Header"
import { NotificationProvider } from "@/context/NotificationContext"
import ImpersonationBanner from '@/pages/auth/ImpersonationBanner'
import SessionIndicator from '@/components/SessionIndicator'
import { useAuth } from "@/hooks/useAuth"

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const location = useLocation()

  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [hasDragged, setHasDragged] = useState(false)


  useAuth()

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
    <NotificationProvider userType="client">
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

      {/* Main app container with animated background */}
      <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 dark:from-gray-900 dark:via-indigo-900 dark:to-purple-900 overflow-hidden">
        {/* Animated Background Decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob dark:bg-purple-600 dark:opacity-35"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000 dark:bg-blue-600 dark:opacity-35"></div>
          <div className="absolute top-40 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000 dark:bg-pink-600 dark:opacity-35"></div>

          {/* Additional decorative blobs for more visual interest */}
          <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob animation-delay-1000 dark:bg-yellow-600 dark:opacity-25"></div>
          <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob animation-delay-3000 dark:bg-green-600 dark:opacity-25"></div>
          <div className="absolute top-3/4 right-1/3 w-60 h-60 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-5000 dark:bg-indigo-600 dark:opacity-30"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-cyan-300 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob animation-delay-6000 dark:bg-cyan-600 dark:opacity-25"></div>
          <div className="absolute top-10 left-10 w-32 h-32 bg-teal-300 rounded-full mix-blend-multiply filter blur-xl opacity-45 animate-blob animation-delay-7000 dark:bg-teal-600 dark:opacity-20"></div>
        </div>

        <ImpersonationBanner />

        {/* Main layout container with subtle background */}
        <div className="relative z-10 flex h-screen bg-white/25 dark:bg-gray-900/25 backdrop-blur-sm">
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
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Header */}
            <Header
              toggleSidebar={toggleSidebar}
              sidebarOpen={sidebarOpen}
              isMobile={isMobile}
            />

            {/* Main Content */}
            <main className="flex-1 overflow-auto relative bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm border-gray-500/20 border-t-2 border-l-2 md:rounded-t-lg md:p-2 shadow-lg">
              <div className="mx-auto p-2 max-w-7xl">
                <Outlet />
              </div>
            </main>

            {/* Session Indicator - Draggable - Moved outside main */}
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