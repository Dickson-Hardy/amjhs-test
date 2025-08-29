'use client'

import { ReactNode } from 'react'
import { ResponsiveDashboardLayout } from './responsive-dashboard-layout'
import { LiveSystemStats } from '@/components/admin/live-system-stats'
import {
  Users,
  FileText,
  Settings,
  BarChart3,
  Shield,
  Mail,
  Bell,
  LogOut,
  ChevronDown,
  Search,
  Home,
  UserCheck,
  Database,
  Activity,
  Newspaper,
  BookOpen
} from 'lucide-react'

interface AdminLayoutProps {
  children: ReactNode
}

// Sidebar definition – remove all demo badge counts; real values should be injected later.
const adminSidebarItems = [
  { 
    id: 'dashboard', 
    href: '/admin/dashboard', 
    icon: Home, 
    label: 'Dashboard', 
    description: 'System overview', 
    shortLabel: 'Home' 
  },
  { 
    id: 'users', 
    href: '/admin/users', 
    icon: Users, 
    label: 'User Management', 
    description: 'Manage users & roles', 
    shortLabel: 'Users' 
  },
  { 
    id: 'submissions', 
    href: '/admin/submissions', 
    icon: FileText, 
    label: 'Submissions', 
    description: 'Review & manage articles', 
    shortLabel: 'Articles' 
  },
  { 
    id: 'applications', 
    href: '/admin/applications', 
    icon: UserCheck, 
    label: 'Reviewer Applications', 
    description: 'Approve reviewers', 
    shortLabel: 'Apps' 
  },
  { 
    id: 'reviewers', 
    href: '/admin/reviewers', 
    icon: Users, 
    label: 'Reviewers', 
    description: 'Manage reviewers', 
    shortLabel: 'Reviews' 
  },
  { 
    id: 'news', 
    href: '/admin/news-management', 
    icon: Newspaper, 
    label: 'News Management', 
    description: 'Manage announcements', 
    shortLabel: 'News' 
  },
  { 
    id: 'current-issue', 
    href: '/admin/current-issue-management', 
    icon: BookOpen, 
    label: 'Current Issue', 
    description: 'Set homepage current issue', 
    shortLabel: 'Issue' 
  },
  { 
    id: 'doi', 
    href: '/admin/doi-management', 
    icon: BarChart3, 
    label: 'DOI Management', 
    description: 'Manage DOI assignments', 
    shortLabel: 'DOI' 
  },
  { 
    id: 'archive', 
    href: '/admin/archive-management', 
    icon: Database, 
    label: 'Archive Management', 
    description: 'Manage publication archive', 
    shortLabel: 'Archive' 
  },
  { 
    id: 'seo', 
    href: '/admin/seo', 
    icon: Settings, 
    label: 'SEO Settings', 
    description: 'Configure SEO', 
    shortLabel: 'SEO' 
  }
]

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <ResponsiveDashboardLayout
      title="AMHSJ Admin"
      subtitle="System Administration"
      navigationItems={adminSidebarItems}
      userRole="Administrator"
      showSearch={true}
      showNotifications={true}
    >
      {children}
    </ResponsiveDashboardLayout>
  )
}
