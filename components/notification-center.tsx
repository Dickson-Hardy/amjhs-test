"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  Bell, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Info, 
  Clock, 
  Mail, 
  Settings,
  Trash2,
  Archive,
  Filter,
  Search
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Notification {
  id: string
  type: "success" | "error" | "warning" | "info" | "reminder"
  title: string
  message: string
  timestamp: string
  isRead: boolean
  isArchived: boolean
  category: "workflow" | "system" | "user" | "review" | "editorial"
  priority: "low" | "medium" | "high" | "urgent"
  actionUrl?: string
  actionText?: string
  metadata?: Record<string, any>
}

interface NotificationCenterProps {
  notifications?: Notification[]
  unreadCount?: number
  onMarkAsRead?: (id: string) => void
  onMarkAllAsRead?: () => void
  onArchive?: (id: string) => void
  onDelete?: (id: string) => void
  onRefresh?: () => void
  isLoading?: boolean
}

export function NotificationCenter({
  notifications = [],
  unreadCount = 0,
  onMarkAsRead,
  onMarkAllAsRead,
  onArchive,
  onDelete,
  onRefresh,
  isLoading = false
}: NotificationCenterProps) {
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterPriority, setFilterPriority] = useState("all")
  const [showArchived, setShowArchived] = useState(false)
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set())

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = filterCategory === "all" || notification.category === filterCategory
    const matchesPriority = filterPriority === "all" || notification.priority === filterPriority
    const matchesArchived = showArchived ? notification.isArchived : !notification.isArchived
    
    return matchesSearch && matchesCategory && matchesPriority && matchesArchived
  })

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-600" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      case "reminder":
        return <Clock className="h-5 w-5 text-blue-600" />
      default:
        return <Info className="h-5 w-5 text-gray-600" />
    }
  }

  const getPriorityColor = (priority: Notification["priority"]) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getCategoryColor = (category: Notification["category"]) => {
    switch (category) {
      case "workflow":
        return "bg-blue-100 text-blue-800"
      case "review":
        return "bg-purple-100 text-purple-800"
      case "editorial":
        return "bg-green-100 text-green-800"
      case "system":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-indigo-100 text-indigo-800"
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return "Just now"
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else if (diffInHours < 48) {
      return "Yesterday"
    } else {
      return date.toLocaleDateString()
    }
  }

  const handleSelectNotification = (id: string) => {
    const newSelected = new Set(selectedNotifications)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedNotifications(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedNotifications.size === filteredNotifications.length) {
      setSelectedNotifications(new Set())
    } else {
      setSelectedNotifications(new Set(filteredNotifications.map(n => n.id)))
    }
  }

  const handleBulkAction = (action: "read" | "archive" | "delete") => {
    selectedNotifications.forEach(id => {
      switch (action) {
        case "read":
          onMarkAsRead?.(id)
          break
        case "archive":
          onArchive?.(id)
          break
        case "delete":
          onDelete?.(id)
          break
      }
    })
    setSelectedNotifications(new Set())
  }

  const unreadNotifications = filteredNotifications.filter(n => !n.isRead)
  const readNotifications = filteredNotifications.filter(n => n.isRead)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-6 w-6" />
          <h2 className="text-xl font-semibold">Notifications</h2>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unreadCount}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={onMarkAllAsRead}>
            Mark All Read
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="workflow">Workflow</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="editorial">Editorial</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Show archived</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedNotifications.size > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-800">
                {selectedNotifications.size} notification(s) selected
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction("read")}
                >
                  Mark as Read
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction("archive")}
                >
                  Archive
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction("delete")}
                  className="text-red-600 hover:text-red-700"
                >
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">
            All ({filteredNotifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread ({unreadNotifications.length})
          </TabsTrigger>
          <TabsTrigger value="read">
            Read ({readNotifications.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <NotificationList
            notifications={filteredNotifications}
            onMarkAsRead={onMarkAsRead}
            onArchive={onArchive}
            onDelete={onDelete}
            onSelect={handleSelectNotification}
            selectedNotifications={selectedNotifications}
            onSelectAll={handleSelectAll}
            allSelected={selectedNotifications.size === filteredNotifications.length}
            showCheckboxes={true}
          />
        </TabsContent>

        <TabsContent value="unread" className="space-y-4">
          <NotificationList
            notifications={unreadNotifications}
            onMarkAsRead={onMarkAsRead}
            onArchive={onArchive}
            onDelete={onDelete}
            showCheckboxes={false}
          />
        </TabsContent>

        <TabsContent value="read" className="space-y-4">
          <NotificationList
            notifications={readNotifications}
            onMarkAsRead={onMarkAsRead}
            onArchive={onArchive}
            onDelete={onDelete}
            showCheckboxes={false}
          />
        </TabsContent>
      </Tabs>

      {filteredNotifications.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-500">
              {searchQuery || filterCategory !== "all" || filterPriority !== "all"
                ? "No notifications match your current filters."
                : "You're all caught up!"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

interface NotificationListProps {
  notifications: Notification[]
  onMarkAsRead?: (id: string) => void
  onArchive?: (id: string) => void
  onDelete?: (id: string) => void
  onSelect?: (id: string) => void
  selectedNotifications?: Set<string>
  onSelectAll?: () => void
  allSelected?: boolean
  showCheckboxes?: boolean
}

function NotificationList({
  notifications,
  onMarkAsRead,
  onArchive,
  onDelete,
  onSelect,
  selectedNotifications = new Set(),
  onSelectAll,
  allSelected = false,
  showCheckboxes = false
}: NotificationListProps) {
  if (notifications.length === 0) return null

  return (
    <div className="space-y-2">
      {showCheckboxes && (
        <div className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={onSelectAll}
            className="rounded"
          />
          <span className="text-sm text-gray-600">Select all</span>
        </div>
      )}
      
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onMarkAsRead={onMarkAsRead}
          onArchive={onArchive}
          onDelete={onDelete}
          onSelect={onSelect}
          isSelected={selectedNotifications.has(notification.id)}
          showCheckbox={showCheckboxes}
        />
      ))}
    </div>
  )
}

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead?: (id: string) => void
  onArchive?: (id: string) => void
  onDelete?: (id: string) => void
  onSelect?: (id: string) => void
  isSelected?: boolean
  showCheckbox?: boolean
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onArchive,
  onDelete,
  onSelect,
  isSelected = false,
  showCheckbox = false
}: NotificationItemProps) {
  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-600" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      case "reminder":
        return <Clock className="h-5 w-5 text-blue-600" />
      default:
        return <Info className="h-5 w-5 text-gray-600" />
    }
  }

  const getPriorityColor = (priority: Notification["priority"]) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getCategoryColor = (category: Notification["category"]) => {
    switch (category) {
      case "workflow":
        return "bg-blue-100 text-blue-800"
      case "review":
        return "bg-purple-100 text-purple-800"
      case "editorial":
        return "bg-green-100 text-green-800"
      case "system":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-indigo-100 text-indigo-800"
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return "Just now"
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else if (diffInHours < 48) {
      return "Yesterday"
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <Card className={`transition-all duration-200 ${notification.isRead ? 'opacity-75' : ''} ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {showCheckbox && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect?.(notification.id)}
              className="mt-1 rounded"
            />
          )}
          
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {getNotificationIcon(notification.type)}
                <h4 className={`font-medium ${notification.isRead ? 'text-gray-600' : 'text-gray-900'}`}>
                  {notification.title}
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={getPriorityColor(notification.priority)}>
                  {notification.priority}
                </Badge>
                <Badge variant="outline" className={getCategoryColor(notification.category)}>
                  {notification.category}
                </Badge>
              </div>
            </div>
            
            <p className={`text-sm ${notification.isRead ? 'text-gray-500' : 'text-gray-700'}`}>
              {notification.message}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                {formatTimestamp(notification.timestamp)}
              </div>
              
              <div className="flex gap-2">
                {!notification.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onMarkAsRead?.(notification.id)}
                    className="h-7 px-2 text-xs"
                  >
                    Mark Read
                  </Button>
                )}
                
                {notification.actionUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                  >
                    {notification.actionText || "View"}
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onArchive?.(notification.id)}
                  className="h-7 px-2 text-xs"
                >
                  <Archive className="h-3 w-3" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete?.(notification.id)}
                  className="h-7 px-2 text-xs text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
