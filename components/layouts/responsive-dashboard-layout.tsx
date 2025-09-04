"use client"

import { ReactNode, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { MobileBottomNav } from '@/components/ui/mobile-bottom-nav'
import {
  LogOut,
  ChevronDown,
  Search,
  Settings,
  Activity,
  Menu,
  Bell,
  HelpCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Image from 'next/image'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LucideIcon } from 'lucide-react'

interface NavigationItem {
  id: string
  href: string
  icon: LucideIcon
  label: string
  description?: string
  shortLabel?: string
}

interface ResponsiveDashboardLayoutProps {
  children: ReactNode
  title: string
  subtitle: string
  navigationItems: NavigationItem[]
  userRole?: string
  showSearch?: boolean
  showNotifications?: boolean
}

export function ResponsiveDashboardLayout({
  children,
  title,
  subtitle,
  navigationItems,
  userRole = 'User',
  showSearch = true,
  showNotifications = true
}: ResponsiveDashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      // Auto-close sidebar on mobile
      if (window.innerWidth < 768) {
        setSidebarOpen(false)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Handle escape key and prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (!isMobile || !sidebarOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSidebarOpen(false)
      }
    }

    // Prevent body scroll when sidebar is open
    document.body.style.overflow = 'hidden'

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isMobile, sidebarOpen])

  const handleNavigation = (href: string) => {
    router.push(href)
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-35 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Fixed Header */}
      <header className="fixed top-0 inset-x-0 h-16 bg-white border-b border-gray-200 z-50 flex items-center px-6 header">
        {/* Logo & Title */}
        <div className="flex items-center">
          {/* Mobile menu button */}
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 h-8 w-8 mr-3 md:hidden"
            >
              <Menu className="h-4 w-4" />
            </Button>
          )}
          <div className="flex items-center space-x-2 mr-3">
            <Image
              src="/logo-amhsj.png"
              alt="AMHSJ Logo"
              width={32}
              height={32}
              className="object-contain"
            />
            <div className="leading-tight">
              <h1 className="text-sm font-semibold text-blue-800">{title}</h1>
              <p className="text-[10px] text-gray-500">{subtitle}</p>
            </div>
          </div>
        </div>
        
        {/* Search - hide on small mobile screens */}
        {showSearch && (
          <div className="flex-1 max-w-xl mx-6 hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search..." className="pl-10 h-9" />
            </div>
          </div>
        )}
        
        {/* User / Actions */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Notifications */}
          {showNotifications && (
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </Button>
          )}
          
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={isMobile && sidebarOpen}>
              <Button variant="ghost" className="h-10 px-2 flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={(session?.user as any)?.image || ""} />
                  <AvatarFallback className="bg-blue-800 text-white text-sm font-medium">
                    {session?.user?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-medium leading-tight truncate max-w-[120px]">
                    {session?.user?.name || 'User'}
                  </p>
                  <p className="text-[10px] text-gray-500 leading-tight">{userRole}</p>
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
                <Settings className="mr-2 h-4 w-4" /> Profile Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/help')}>
                <HelpCircle className="mr-2 h-4 w-4" /> Help & Support
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Activity className="mr-2 h-4 w-4" /> Activity Log
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/' })} className="text-red-600 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Sidebar + Main */}
      <div className="pt-16 flex">
        {/* Desktop Sidebar */}
        <aside className={cn(
          "fixed top-16 bottom-0 left-0 w-64 bg-white border-r border-gray-200 z-30 sidebar flex flex-col",
          isMobile ? "hidden" : "block"
        )}>
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1">
              {navigationItems.map(item => {
                const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-md text-sm transition-colors',
                      isActive 
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    )}
                  >
                    <item.icon className={cn('h-5 w-5', isActive ? 'text-indigo-600' : 'text-slate-400')} />
                    <span className="flex-1">
                      <span className="block font-medium leading-tight">{item.label}</span>
                      {item.description && (
                        <span className="block text-[11px] text-slate-500 leading-tight">{item.description}</span>
                      )}
                    </span>
                  </Link>
                )
              })}
            </div>
          </nav>
        </aside>

        {/* Mobile Sidebar Overlay with Backdrop */}
        {isMobile && sidebarOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden mobile-sidebar-backdrop"
              onClick={() => setSidebarOpen(false)}
            />
            
            {/* Sidebar */}
            <aside className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white border-r border-gray-200 z-50 md:hidden sidebar flex flex-col max-h-screen shadow-xl mobile-sidebar">
              <div className="flex-shrink-0 h-16 border-b border-gray-200 flex items-center justify-between px-4 bg-white">
                <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
              <nav className="flex-1 overflow-y-auto py-2 px-3" style={{ WebkitOverflowScrolling: 'touch' }}>
                <div className="space-y-1 pb-safe-area-inset-bottom">
                  {navigationItems.map(item => {
                    const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/')
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          'flex items-center gap-3 p-4 rounded-lg text-sm transition-colors min-h-[64px] touch-manipulation block w-full',
                          isActive 
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100'
                        )}
                      >
                        <item.icon className={cn('h-6 w-6 flex-shrink-0', isActive ? 'text-indigo-600' : 'text-slate-400')} />
                        <span className="flex-1 min-w-0">
                          <span className="block font-medium leading-tight text-base">{item.label}</span>
                          {item.description && (
                            <span className="block text-sm text-slate-500 leading-tight mt-1">{item.description}</span>
                          )}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </nav>
              <div className="flex-shrink-0 border-t border-gray-200 p-4 bg-white pb-safe-area-inset-bottom">
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="w-full flex items-center justify-center gap-2 p-3 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors touch-manipulation min-h-[48px]"
                >
                  <span className="text-base">Close Menu</span>
                </button>
              </div>
            </aside>
          </>
        )}

        <main className={cn(
          "h-[calc(100vh-4rem)] overflow-y-auto bg-slate-50 relative z-10 dashboard-content",
          isMobile ? "ml-0 pb-16 w-full" : "ml-64 w-[calc(100vw-16rem)]"
        )}>
          <div className="w-full h-full relative z-20">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav 
        items={navigationItems} 
        onItemClick={handleNavigation}
      />
    </div>
  )
}

export default ResponsiveDashboardLayout