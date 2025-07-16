// Frontend\src\pages\client\layout\Sidebar.tsx

"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Link, useLocation } from "react-router-dom"
import {
<<<<<<< HEAD
=======
  ChevronDown,
  ChevronRight,
>>>>>>> f806768ba8dc147a3cca36fb32e2161b526190d1
  BarChart2,
  DollarSign,
  User,
  Monitor,
  Users,
  Briefcase,
  // HeadphonesIcon,
  Home,
<<<<<<< HEAD
  UserPlus,
  BarChart3,
  Percent,
  CreditCard,
  PlusCircle,
  ArrowUpDown,
  ArrowDownToLine,
  List,
  Trophy,
  History,
  Wallet,
=======
>>>>>>> f806768ba8dc147a3cca36fb32e2161b526190d1
} from "lucide-react"

interface SidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
  isMobile?: boolean
  onItemClick?: () => void
}

interface MenuItem {
  title: string
  icon: React.ElementType
  path?: string
  submenu?: {
    title: string
    path: string
<<<<<<< HEAD
    icon: React.ElementType  // Add this line
=======
>>>>>>> f806768ba8dc147a3cca36fb32e2161b526190d1
  }[]
}

export default function Sidebar({ open, isMobile = false, onItemClick }: SidebarProps) {
  const location = useLocation()
<<<<<<< HEAD
  // const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({})
=======
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({})
>>>>>>> f806768ba8dc147a3cca36fb32e2161b526190d1
  const [isHoveringCollapsed, setIsHoveringCollapsed] = useState(false)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const menuItems: MenuItem[] = [
    {
      title: "Dashboard",
      icon: Home,
      path: "/client/dashboard",
    },
    {
      title: "Financial Operations",
      icon: DollarSign,
      submenu: [
<<<<<<< HEAD
        { title: "Deposit", path: "/client/financial/deposit", icon: Wallet },
        { title: "Withdrawal", path: "/client/financial/withdrawal", icon: ArrowDownToLine },
        { title: "Transfer", path: "/client/financial/transfer", icon: ArrowUpDown },
        { title: "Transaction History", path: "/client/financial/history", icon: History },
=======
        { title: "Deposit", path: "/client/financial/deposit" },
        { title: "Withdrawal", path: "/client/financial/withdrawal" },
        { title: "Transfer", path: "/client/financial/transfer" },
        { title: "Transaction History", path: "/client/financial/history" },
>>>>>>> f806768ba8dc147a3cca36fb32e2161b526190d1
      ],
    },
    {
      title: "My Account",
      icon: User,
      submenu: [
<<<<<<< HEAD
        { title: "Open New Account", path: "/client/account/new", icon: PlusCircle },
        { title: "Account List", path: "/client/account/list", icon: List },
        { title: "Trading Contest", path: "/client/account/trading-contest", icon: Trophy },
=======
        { title: "Open New Account", path: "/client/account/new" },
        { title: "Account List", path: "/client/account/list" },
        { title: "Trading Contest", path: "/client/account/trading-contest" },
>>>>>>> f806768ba8dc147a3cca36fb32e2161b526190d1
      ],
    },
    {
      title: "Trading Platforms",
      icon: Monitor,
      path: "/client/trading-platforms",
    },
    {
      title: "Refer A Friend",
      icon: Users,
      path: "/client/refer-friend",
    },
    {
      title: "Partner Zone",
      icon: Briefcase,
      submenu: [
<<<<<<< HEAD
        { title: "Create New Account", path: "/client/partner/new-account", icon: UserPlus },
        { title: "Partner Dashboard", path: "/client/partner/dashboard", icon: BarChart3 },
        { title: "IB Commission", path: "/client/partner/ib-commission", icon: Percent },
        { title: "IB Withdrawal", path: "/client/partner/ib-withdrawal", icon: CreditCard },
      ],
    },

=======
        { title: "Create New Account", path: "/client/partner/new-account" },
        { title: "Partner Dashboard", path: "/client/partner/dashboard" },
        { title: "IB Commission", path: "/client/partner/ib-commission" },
        { title: "IB Withdrawal", path: "/client/partner/ib-withdrawal" },
      ],
    },
>>>>>>> f806768ba8dc147a3cca36fb32e2161b526190d1
    // {
    //   title: "Customer Support",
    //   icon: HeadphonesIcon,
    //   submenu: [{ title: "My Enquiries", path: "/client/support/clientportal" }],
    // },
  ]

<<<<<<< HEAD
=======
  const toggleMenu = (title: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [title]: !prev[title],
    }))
  }

>>>>>>> f806768ba8dc147a3cca36fb32e2161b526190d1
  const isActive = (path: string) => {
    return location.pathname === path
  }

<<<<<<< HEAD
=======
  const isSubmenuActive = (submenu: { title: string; path: string }[]) => {
    return submenu.some(item => location.pathname === item.path)
  }

>>>>>>> f806768ba8dc147a3cca36fb32e2161b526190d1
  const handleItemClick = () => {
    if (onItemClick) {
      onItemClick()
    }
  }

  // Handle hover for collapsed sidebar
  const handleSidebarMouseEnter = () => {
    if (!isMobile && !open) {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
      hoverTimeoutRef.current = setTimeout(() => {
        setIsHoveringCollapsed(true)
      }, 50) // Reduced delay for faster response
    }
  }

  const handleSidebarMouseLeave = () => {
    if (!isMobile && !open) {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
      hoverTimeoutRef.current = setTimeout(() => {
        setIsHoveringCollapsed(false)
      }, 150) // Optimized delay for smooth exit
    }
  }

  // Determine if sidebar should show expanded view
  const shouldShowExpanded = open || isMobile || (!isMobile && !open && isHoveringCollapsed)

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

<<<<<<< HEAD
  // useEffect(() => {
  //   const initializeExpandedMenus = () => {
  //     const newExpandedMenus: Record<string, boolean> = {}
  //     menuItems.forEach(item => {
  //       if (item.submenu) {
  //         const hasActiveItem = item.submenu.some(subItem => location.pathname === subItem.path)
  //         if (hasActiveItem) {
  //           newExpandedMenus[item.title] = true
  //         }
  //       }
  //     })
  //     setExpandedMenus(newExpandedMenus)
  //   }
  //   initializeExpandedMenus()
  // }, [])

  // useEffect(() => {
  //   const updateExpandedMenus = () => {
  //     setExpandedMenus(prev => {
  //       const newExpandedMenus = { ...prev }
  //       menuItems.forEach(item => {
  //         if (item.submenu) {
  //           const hasActiveItem = item.submenu.some(subItem => location.pathname === subItem.path)
  //           if (hasActiveItem && !newExpandedMenus[item.title]) {
  //             newExpandedMenus[item.title] = true
  //           }
  //         }
  //       })
  //       return newExpandedMenus
  //     })
  //   }
  //   updateExpandedMenus()
  // }, [location.pathname])
=======
  useEffect(() => {
    const initializeExpandedMenus = () => {
      const newExpandedMenus: Record<string, boolean> = {}
      menuItems.forEach(item => {
        if (item.submenu) {
          const hasActiveItem = item.submenu.some(subItem => location.pathname === subItem.path)
          if (hasActiveItem) {
            newExpandedMenus[item.title] = true
          }
        }
      })
      setExpandedMenus(newExpandedMenus)
    }
    initializeExpandedMenus()
  }, [])

  useEffect(() => {
    const updateExpandedMenus = () => {
      setExpandedMenus(prev => {
        const newExpandedMenus = { ...prev }
        menuItems.forEach(item => {
          if (item.submenu) {
            const hasActiveItem = item.submenu.some(subItem => location.pathname === subItem.path)
            if (hasActiveItem && !newExpandedMenus[item.title]) {
              newExpandedMenus[item.title] = true
            }
          }
        })
        return newExpandedMenus
      })
    }
    updateExpandedMenus()
  }, [location.pathname])
>>>>>>> f806768ba8dc147a3cca36fb32e2161b526190d1

  return (
    <aside
      className={`
        ${isMobile
          ? `fixed left-0 top-0 z-50 h-full w-64 transform transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full'
          }`
          : `${shouldShowExpanded ? "w-64" : "w-20"} transition-all duration-500 ease-in-out`
        } 
        flex flex-col flex-shrink-0 overflow-hidden h-full bg-[#F5F5F5] dark:bg-[#111315]
      `}
      onMouseEnter={handleSidebarMouseEnter}
      onMouseLeave={handleSidebarMouseLeave}
    >
      {/* Animated Background Layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-800 dark:to-indigo-900">
        {/* Sidebar-specific animated blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-8 left-8 w-28 h-28 bg-blue-300/60 rounded-full mix-blend-multiply filter blur-xl animate-blob dark:bg-blue-600/30"></div>
          <div className="absolute top-1/3 right-6 w-24 h-24 bg-purple-300/50 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000 dark:bg-purple-600/25"></div>
          <div className="absolute bottom-1/3 left-6 w-26 h-26 bg-indigo-300/55 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000 dark:bg-indigo-600/30"></div>
          <div className="absolute bottom-12 right-10 w-20 h-20 bg-cyan-300/45 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-1000 dark:bg-cyan-600/20"></div>
          <div className="absolute top-2/3 left-1/3 w-18 h-18 bg-teal-300/40 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-3000 dark:bg-teal-600/25"></div>
          <div className="absolute top-1/2 right-8 w-16 h-16 bg-pink-300/35 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-5000 dark:bg-pink-600/20"></div>
        </div>
      </div>

      {/* Header */}
      <div className="flex h-16 items-center justify-center border-gray-200 dark:border-gray-700 transition-all duration-500 ease-in-out flex-shrink-0">
        <div className={`transition-all duration-500 ease-in-out ${shouldShowExpanded ? 'opacity-100 scale-100' : 'opacity-100 scale-100'}`}>
          {shouldShowExpanded ? (
            <h2 className="text-xl font-bold text-gray-800 dark:text-white whitespace-nowrap transition-all duration-500 ease-in-out">TestCRM</h2>
          ) : (
            <BarChart2 className="h-8 w-8 text-gray-800 dark:text-white transition-all duration-500 ease-in-out" />
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-2 px-2 mb-4 overflow-y-auto flex-1 scrollbar-hidden min-h-0">
<<<<<<< HEAD
        <ul className="">
          {menuItems.map((item) => (
            <div key={item.title}>
              {/* Menu Title - Unclickable and smaller font */}
              <div className={`-my-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-all duration-500 ease-in-out overflow-hidden ${shouldShowExpanded ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0'}`}>
                {item.title}
              </div>

              {/* Menu Items */}
              {item.submenu ? (
                /* Submenu Items */
                item.submenu.map((subItem) => (
                  <li key={subItem.title} className="relative py-0.5">
                    <Link
                      to={subItem.path}
                      onClick={handleItemClick}
                      className={`flex items-center rounded-sidebar px-3 py-2 text-sm font-medium transition-all duration-300 ease-in-out ${isActive(subItem.path)
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-100 font-semibold"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-400 hover:to-purple-500 hover:text-white hover:shadow-md hover:scale-102"
                        } ${shouldShowExpanded ? "" : "justify-center"}`}
                    >
                      <subItem.icon className={`h-5 w-5 transition-all duration-300 ease-in-out ${isActive(subItem.path)
                        ? "text-gray-900 dark:text-gray-100"
                        : "text-gray-500 dark:text-gray-400"
                        }`} />
                      <span className={`ml-3 whitespace-nowrap transition-all duration-500 ease-in-out overflow-hidden ${shouldShowExpanded ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0 ml-0'
                        }`}>
                        {subItem.title}
                      </span>
                    </Link>
                  </li>
                ))
              ) : (
                /* Single Menu Item */
                <li className="relative">
                  <Link
                    to={item.path || "#"}
                    onClick={handleItemClick}
                    className={`flex items-center rounded-sidebar px-3 py-2 text-sm font-medium transition-all duration-300 ease-in-out ${isActive(item.path || "")
=======
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.title} className="relative">
              {item.submenu ? (
                <div>
                  {/* Parent Menu Item */}
                  <button
                    onClick={() => toggleMenu(item.title)}
                    className={`flex w-full items-center rounded-sidebar px-3 py-2 text-sm font-medium transition-all duration-300 ease-in-out ${isSubmenuActive(item.submenu)
>>>>>>> f806768ba8dc147a3cca36fb32e2161b526190d1
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-100 font-semibold"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-400 hover:to-purple-500 hover:text-white hover:shadow-md hover:scale-102"
                      } ${shouldShowExpanded ? "" : "justify-center"}`}
                  >
<<<<<<< HEAD
                    <item.icon className={`h-5 w-5 transition-all duration-300 ease-in-out ${isActive(item.path || "")
                      ? "text-gray-900 dark:text-gray-100"
                      : "text-gray-500 dark:text-gray-400"
                      }`} />
                    <span className={`ml-3 whitespace-nowrap transition-all duration-500 ease-in-out overflow-hidden ${shouldShowExpanded ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0 ml-0'
                      }`}>
                      {item.title}
                    </span>
                  </Link>
                </li>
              )}
            </div>
=======
                    <item.icon className={`h-5 w-5 transition-all duration-300 ease-in-out ${isSubmenuActive(item.submenu)
                      ? "text-gray-900 dark:text-gray-100"
                      : "text-gray-500 dark:text-gray-400"
                      }`} />
                    <div className={`ml-3 flex-1 flex items-center justify-between transition-all duration-500 ease-in-out overflow-hidden ${shouldShowExpanded ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0 ml-0'
                      }`}>
                      <span className="text-left whitespace-nowrap">{item.title}</span>
                      {expandedMenus[item.title] ? (
                        <ChevronDown className="h-4 w-4 transition-all duration-300 ease-in-out flex-shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 transition-all duration-300 ease-in-out flex-shrink-0" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Submenu with Hierarchical Lines */}
                  <div className={`relative mt-1 transition-all duration-400 ease-in-out overflow-hidden ${shouldShowExpanded && expandedMenus[item.title]
                    ? 'opacity-100 max-h-96'
                    : 'opacity-0 max-h-0'
                    }`}>
                    <ul className="space-y-1">
                      {item.submenu.map((subItem, index) => (
                        <li key={subItem.title} className="relative">
                          {/* Curved Hierarchical Line for each item */}
                          <div className={`absolute left-6 top-0 h-full w-8 flex items-center transition-all duration-400 ease-in-out ${shouldShowExpanded && expandedMenus[item.title] ? 'opacity-100' : 'opacity-0'
                            }`}>
                            <svg
                              className="w-8 h-12 text-gray-300 dark:text-gray-600"
                              viewBox="0 0 32 48"
                              fill="none"
                            >
                              {/* Vertical line from top */}
                              {index > 0 && (
                                <path
                                  d="M 12 0 L 12 24"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  fill="none"
                                />
                              )}

                              {/* Curved connection to horizontal line */}
                              <path
                                d={index === item.submenu!.length - 1
                                  ? "M 12 24 Q 12 28 16 28 L 32 28" // Last item: curved corner only
                                  : "M 12 24 Q 12 28 16 28 L 32 28 M 12 28 L 12 48" // Middle items: curve + continue down
                                }
                                stroke="currentColor"
                                strokeWidth="1.5"
                                fill="none"
                              />
                            </svg>
                          </div>

                          <Link
                            to={subItem.path}
                            onClick={handleItemClick}
                            className={`block rounded-sidebar ml-12 px-3 py-2 text-sm font-medium transition-all duration-300 ease-in-out ${isActive(subItem.path)
                              ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg transform scale-100 font-semibold"
                              : "text-gray-600 dark:text-gray-400 hover:bg-gradient-to-r hover:from-emerald-400 hover:to-teal-500 hover:text-white hover:shadow-md hover:scale-102"
                              }`}
                          >
                            <span className="whitespace-nowrap">{subItem.title}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                /* Single Menu Item */
                <Link
                  to={item.path || "#"}
                  onClick={handleItemClick}
                  className={`flex items-center rounded-sidebar px-3 py-2 text-sm font-medium transition-all duration-300 ease-in-out ${isActive(item.path || "")
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-100 font-semibold"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-400 hover:to-purple-500 hover:text-white hover:shadow-md hover:scale-102"
                    } ${shouldShowExpanded ? "" : "justify-center"}`}
                >
                  <item.icon className={`h-5 w-5 transition-all duration-300 ease-in-out ${isActive(item.path || "")
                    ? "text-gray-900 dark:text-gray-100"
                    : "text-gray-500 dark:text-gray-400"
                    }`} />
                  <span className={`ml-3 whitespace-nowrap transition-all duration-500 ease-in-out overflow-hidden ${shouldShowExpanded ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0 ml-0'
                    }`}>
                    {item.title}
                  </span>
                </Link>
              )}
            </li>
>>>>>>> f806768ba8dc147a3cca36fb32e2161b526190d1
          ))}
        </ul>
      </nav>
    </aside>
  )
}