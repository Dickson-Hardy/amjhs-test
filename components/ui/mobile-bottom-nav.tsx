"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface NavigationItem {
  id: string
  label: string
  icon: LucideIcon
  href: string
  shortLabel?: string
}

interface MobileBottomNavProps {
  items: NavigationItem[]
  onItemClick?: (href: string) => void
  className?: string
}

export function MobileBottomNav({ 
  items, 
  onItemClick, 
  className 
}: MobileBottomNavProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleItemClick = (item: NavigationItem) => {
    // Add haptic feedback if available
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10)
    }

    if (onItemClick) {
      onItemClick(item.href)
    } else {
      router.push(item.href)
    }
  }

  // Take only first 5 items for mobile bottom nav to prevent overcrowding
  const mobileItems = items.slice(0, 5)

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-slate-200",
      "px-2 py-1 safe-area-inset-bottom", // Safe area for iOS
      "md:hidden", // Only show on mobile
      className
    )}>
      <nav className="flex items-center justify-around max-w-md mx-auto">
        {mobileItems.map((item) => {
          const isActive = item.href === pathname || 
            (item.href === "/dashboard" && pathname === "/dashboard") ||
            (item.href.includes("?tab=") && pathname.includes(item.href.split("?tab=")[1])) ||
            (pathname.startsWith(item.href) && item.href !== '/')
          
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={cn(
                "flex flex-col items-center justify-center px-1 py-2 rounded-lg text-xs font-medium transition-all duration-200 min-w-0 flex-1",
                "active:scale-95 transform transition-transform",
                "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1",
                isActive
                  ? "text-indigo-600 bg-indigo-50 scale-105"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              )}
              aria-label={item.label}
              role="tab"
              aria-selected={isActive}
            >
              <item.icon 
                className={cn(
                  "h-5 w-5 mb-1 transition-colors duration-200",
                  isActive ? "text-indigo-600" : "text-slate-400"
                )} 
              />
              <span 
                className={cn(
                  "truncate w-full text-center leading-tight transition-colors duration-200",
                  isActive ? "text-indigo-600 font-semibold" : "text-slate-600"
                )}
              >
                {item.shortLabel || item.label}
              </span>
              {isActive && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-indigo-600 rounded-full" />
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}

export default MobileBottomNav