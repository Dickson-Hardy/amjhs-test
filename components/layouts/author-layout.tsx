"use client"

import { ReactNode } from 'react'
import { ResponsiveDashboardLayout } from './responsive-dashboard-layout'
import {
  FileText,
  Plus,
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
  Upload,
  Calendar,
  Settings,
  BookOpen,
  User,
  BarChart3,
  MessageSquare
} from 'lucide-react'

interface AuthorLayoutProps {
  children: ReactNode
}

const authorSidebarItems = [
  { 
    id: 'dashboard',
    href: '/author/dashboard', 
    icon: Home, 
    label: 'Dashboard', 
    description: 'Submission overview',
    shortLabel: 'Home'
  },
  { 
    id: 'profile',
    href: '/author/profile', 
    icon: User, 
    label: 'My Profile', 
    description: 'Complete your profile',
    shortLabel: 'Profile'
  },
  { 
    id: 'submit',
    href: '/author/submit', 
    icon: Plus, 
    label: 'New Submission', 
    description: 'Submit manuscript',
    shortLabel: 'Submit'
  },
  { 
    id: 'submissions',
    href: '/author/submissions', 
    icon: FileText, 
    label: 'My Submissions', 
    description: 'View all manuscripts',
    shortLabel: 'Papers'
  },
  { 
    id: 'revisions',
    href: '/author/submissions?filter=revisions', 
    icon: Upload, 
    label: 'Revisions Required', 
    description: 'Respond to reviews',
    shortLabel: 'Revise'
  },
  { 
    id: 'reviews',
    href: '/author/submissions?tab=reviews', 
    icon: Eye, 
    label: 'Review Status', 
    description: 'Peer review progress',
    shortLabel: 'Reviews'
  },
  { 
    id: 'published',
    href: '/author/submissions?filter=published', 
    icon: CheckCircle, 
    label: 'Published Works', 
    description: 'Published articles',
    shortLabel: 'Published'
  },
  { 
    id: 'messages',
    href: '/author/messages', 
    icon: MessageSquare, 
    label: 'Editorial Messages', 
    description: 'Editor communications',
    shortLabel: 'Messages'
  },
  { 
    id: 'analytics',
    href: '/author/analytics', 
    icon: BarChart3, 
    label: 'Publication Metrics', 
    description: 'Impact & citations',
    shortLabel: 'Metrics'
  },
  { 
    id: 'guidelines',
    href: '/author/guidelines', 
    icon: BookOpen, 
    label: 'Submission Guidelines', 
    description: 'Author guidelines',
    shortLabel: 'Guide'
  },
  { 
    id: 'preferences',
    href: '/author/preferences', 
    icon: Settings, 
    label: 'Preferences', 
    description: 'Account settings',
    shortLabel: 'Settings'
  }
]

export default function AuthorLayout({ children }: AuthorLayoutProps) {
  return (
    <ResponsiveDashboardLayout
      title="AMHSJ Author Portal"
      subtitle="Submission System"
      navigationItems={authorSidebarItems}
      userRole="Author"
      showSearch={true}
      showNotifications={true}
    >
      {children}
    </ResponsiveDashboardLayout>
  )
}
