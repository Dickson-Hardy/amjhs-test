"use client"

import { ReactNode } from 'react'
import { ResponsiveDashboardLayout } from './responsive-dashboard-layout'
import {
  FileText,
  Eye,
  Clock,
  CheckCircle,
  TrendingUp,
  Mail,
  Bell,
  LogOut,
  ChevronDown,
  Search,
  Home,
  Star,
  Calendar,
  Settings,
  BookOpen,
  Award,
  BarChart3
} from 'lucide-react'

interface ReviewerLayoutProps {
  children: ReactNode
}

const reviewerSidebarItems = [
  { 
    id: 'dashboard',
    href: '/reviewer', 
    icon: Home, 
    label: 'Dashboard', 
    description: 'Review overview',
    shortLabel: 'Home'
  },
  { 
    id: 'assignments',
    href: '/reviewer/assignments', 
    icon: FileText, 
    label: 'Active Reviews', 
    description: 'Current assignments',
    shortLabel: 'Active'
  },
  { 
    id: 'invitations',
    href: '/reviewer/invitations', 
    icon: Mail, 
    label: 'Review Invitations', 
    description: 'Pending invitations',
    shortLabel: 'Invites'
  },
  { 
    id: 'completed',
    href: '/reviewer/completed', 
    icon: CheckCircle, 
    label: 'Completed Reviews', 
    description: 'Review history',
    shortLabel: 'Done'
  },
  { 
    id: 'calendar',
    href: '/reviewer/calendar', 
    icon: Calendar, 
    label: 'Review Calendar', 
    description: 'Deadlines & schedule',
    shortLabel: 'Calendar'
  },
  { 
    id: 'expertise',
    href: '/reviewer/expertise', 
    icon: Star, 
    label: 'Expertise Profile', 
    description: 'Research areas',
    shortLabel: 'Profile'
  },
  { 
    id: 'performance',
    href: '/reviewer/performance', 
    icon: BarChart3, 
    label: 'Performance', 
    description: 'Review metrics',
    shortLabel: 'Stats'
  },
  { 
    id: 'guidelines',
    href: '/reviewer/guidelines', 
    icon: BookOpen, 
    label: 'Review Guidelines', 
    description: 'Best practices',
    shortLabel: 'Guide'
  },
  { 
    id: 'settings',
    href: '/reviewer/settings', 
    icon: Settings, 
    label: 'Preferences', 
    description: 'Review settings',
    shortLabel: 'Settings'
  }
]

export default function ReviewerLayout({ children }: ReviewerLayoutProps) {
  return (
    <ResponsiveDashboardLayout
      title="AMHSJ Reviewer"
      subtitle="Peer Review Portal"
      navigationItems={reviewerSidebarItems}
      userRole="Reviewer"
      showSearch={true}
      showNotifications={true}
    >
      {children}
    </ResponsiveDashboardLayout>
  )
}
