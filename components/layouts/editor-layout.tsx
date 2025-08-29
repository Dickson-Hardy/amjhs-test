"use client"

import { ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { ResponsiveDashboardLayout } from './responsive-dashboard-layout'
import {
  FileText,
  Users,
  Calendar,
  Clock,
  TrendingUp,
  Mail,
  Bell,
  LogOut,
  ChevronDown,
  Search,
  Home,
  Edit3,
  UserCheck,
  Eye,
  Settings,
  BookOpen,
  Archive,
  BarChart3
} from 'lucide-react'

interface EditorLayoutProps {
  children: ReactNode
}

// Removed badge counts (demo) – real counts to be fetched dynamically.
const editorSidebarItems = [
  { 
    id: 'dashboard',
    href: '/editor/dashboard', 
    icon: Home, 
    label: 'Dashboard', 
    description: 'Editorial overview',
    shortLabel: 'Home'
  },
  { 
    id: 'submissions',
    href: '/editor/submissions', 
    icon: FileText, 
    label: 'Manuscripts', 
    description: 'Active submissions',
    shortLabel: 'Articles'
  },
  { 
    id: 'reviews',
    href: '/editor/reviews', 
    icon: Eye, 
    label: 'Reviews', 
    description: 'Peer review status',
    shortLabel: 'Reviews'
  },
  { 
    id: 'assignments',
    href: '/editor/assignments', 
    icon: UserCheck, 
    label: 'Reviewers', 
    description: 'Manage reviewers',
    shortLabel: 'Reviewers'
  },
  { 
    id: 'decisions',
    href: '/editor/decisions', 
    icon: Edit3, 
    label: 'Editorial Decisions', 
    description: 'Make decisions',
    shortLabel: 'Decisions'
  },
  { 
    id: 'calendar',
    href: '/editor/calendar', 
    icon: Calendar, 
    label: 'Editorial Calendar', 
    description: 'Deadlines & events',
    shortLabel: 'Calendar'
  },
  { 
    id: 'reports',
    href: '/editor/reports', 
    icon: BarChart3, 
    label: 'Analytics', 
    description: 'Performance metrics',
    shortLabel: 'Analytics'
  },
  { 
    id: 'archive',
    href: '/archive', 
    icon: Archive, 
    label: 'Published Issues', 
    description: 'Archive management',
    shortLabel: 'Archive'
  },
  { 
    id: 'settings',
    href: '/editor/settings', 
    icon: Settings, 
    label: 'Editorial Settings', 
    description: 'Workflow preferences',
    shortLabel: 'Settings'
  }
]

export default function EditorLayout({ children }: EditorLayoutProps) {
  const { data: session } = useSession()

  const getEditorTitle = () => {
    if (session?.user?.email === 'eic@amhsj.org') return 'Editor-in-Chief'
    if (session?.user?.email === 'managing@amhsj.org') return 'Managing Editor'
    if (session?.user?.email?.includes('section')) return 'Section Editor'
    if (session?.user?.email?.includes('production')) return 'Production Editor'
    if (session?.user?.email?.includes('guest')) return 'Guest Editor'
    return 'Associate Editor'
  }

  return (
    <ResponsiveDashboardLayout
      title="AMHSJ Editorial"
      subtitle="Management Console"
      navigationItems={editorSidebarItems}
      userRole={getEditorTitle()}
      showSearch={true}
      showNotifications={true}
    >
      {children}
    </ResponsiveDashboardLayout>
  )
}
