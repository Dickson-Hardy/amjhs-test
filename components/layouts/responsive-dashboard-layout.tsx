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
            <DropdownMenuTrigger asChild>
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
          "fixed top-16 bottom-0 left-0 w-64 bg-white border-r border-gray-200 overflow-y-auto transition-transform duration-300 z-30 sidebar",
          isMobile ? "hidden" : "block"
        )}>
          <nav className="p-4 space-y-1">
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
          </nav>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {isMobile && sidebarOpen && (
          <aside className="fixed top-16 bottom-0 left-0 w-64 bg-white border-r border-gray-200 overflow-y-auto z-40 md:hidden sidebar">
            <nav className="p-4 space-y-1">
              {navigationItems.map(item => {
                const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
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
            </nav>
          </aside>
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