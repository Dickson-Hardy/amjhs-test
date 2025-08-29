"use client"

import React, { useState, useEffect } from 'react'
import { 
  Bell, 
  X, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Clock,
  Settings,
  Filter,
  MailCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error' | 'system'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  isRead: boolean
  timestamp: Date
  actionUrl?: string
  actionLabel?: string
  category: 'submission' | 'review' | 'system' | 'security' | 'update'
  metadata?: Record<string, any>
}

interface NotificationSystemProps {
  className?: string
  maxVisible?: number
  enableSound?: boolean
  enableDesktop?: boolean
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({
  className,
  maxVisible = 5,
  enableSound = true,
  enableDesktop = true
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread' | 'important'>('all')
  const [settings, setSettings] = useState({
    sound: enableSound,
    desktop: enableDesktop,
    email: true,
    pauseAll: false
  })

  // Load notifications on mount
  useEffect(() => {
    fetchNotifications()
    
    // Set up real-time updates
    const eventSource = new EventSource('/api/notifications/stream')
    
    eventSource.onmessage = (event) => {
      const notification: Notification = JSON.parse(event.data)
      addNotification(notification)
    }

    return () => {
      eventSource.close()
    }
  }, [])

  // Request desktop notification permission
  useEffect(() => {
    if (settings.desktop && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission()
      }
    }
  }, [settings.desktop])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')
      const data = await response.json()
      if (data.success) {
        setNotifications(data.notifications)
      }
    } catch (error) {
      logger.error('Failed to fetch notifications:', error)
    }
  }

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev].slice(0, 50)) // Keep max 50
    
    // Show toast for high priority notifications
    if (notification.priority === 'high' || notification.priority === 'urgent') {
      const toastVariant = notification.type === 'error' ? 'destructive' : 
                          notification.type === 'warning' ? 'warning' :
                          notification.type === 'success' ? 'success' : 'info'
      
      toast({
        title: notification.title,
        description: notification.message,
        variant: toastVariant,
        duration: notification.priority === 'urgent' ? 0 : 8000
      })
    }

    // Play sound
    if (settings.sound && !settings.pauseAll) {
      playNotificationSound(notification.type)
    }

    // Show desktop notification
    if (settings.desktop && !settings.pauseAll && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        tag: notification.id
      })
    }
  }

  const playNotificationSound = (type: string) => {
    const audio = new Audio(`/sounds/notification-${type}.mp3`)
    audio.volume = 0.3
    audio.play().catch(() => {
      // Fallback to system sound
      const audio2 = new Audio('/sounds/notification-default.mp3')
      audio2.volume = 0.3
      audio2.play().catch(() => {}) // Silent fail
    })
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, { method: 'POST' })
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      )
    } catch (error) {
      logger.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', { method: 'POST' })
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      toast.success('All notifications marked as read')
    } catch (error) {
      logger.error('Failed to mark all as read:', error)
      toast.error('Failed to mark notifications as read')
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, { method: 'DELETE' })
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
    } catch (error) {
      logger.error('Failed to delete notification:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-600" />
      case 'error':
        return <X className="h-4 w-4 text-red-600" />
      case 'info':
      default:
        return <Info className="h-4 w-4 text-blue-600" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50'
      case 'high':
        return 'border-l-orange-500 bg-orange-50'
      case 'medium':
        return 'border-l-blue-500 bg-blue-50'
      case 'low':
      default:
        return 'border-l-gray-500 bg-gray-50'
    }
  }

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead
    if (filter === 'important') return n.priority === 'high' || n.priority === 'urgent'
    return true
  })

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn("relative", className)}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs bg-red-500 text-white"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-96 p-0" align="end" sideOffset={8}>
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64" align="end">
                    <div className="space-y-4">
                      <h4 className="font-medium">Notification Settings</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm">Sound alerts</label>
                          <Switch 
                            checked={settings.sound}
                            onCheckedChange={(checked) => 
                              setSettings(prev => ({ ...prev, sound: checked }))
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="text-sm">Desktop notifications</label>
                          <Switch 
                            checked={settings.desktop}
                            onCheckedChange={(checked) => 
                              setSettings(prev => ({ ...prev, desktop: checked }))
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="text-sm">Email notifications</label>
                          <Switch 
                            checked={settings.email}
                            onCheckedChange={(checked) => 
                              setSettings(prev => ({ ...prev, email: checked }))
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="text-sm">Pause all</label>
                          <Switch 
                            checked={settings.pauseAll}
                            onCheckedChange={(checked) => 
                              setSettings(prev => ({ ...prev, pauseAll: checked }))
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                    <MailCheck className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            <Tabs value={filter} onValueChange={(value: string) => setFilter(value)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unread">
                  Unread {unreadCount > 0 && `(${unreadCount})`}
                </TabsTrigger>
                <TabsTrigger value="important">Important</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No notifications to show</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredNotifications.slice(0, maxVisible).map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-4 border-l-4 transition-colors hover:bg-gray-50",
                        getPriorityColor(notification.priority),
                        !notification.isRead && "bg-blue-50/50"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className={cn(
                                "text-sm font-medium",
                                !notification.isRead && "font-semibold"
                              )}>
                                {notification.title}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {notification.category}
                                </Badge>
                                <span className="text-xs text-gray-500 flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
                                    Math.floor((notification.timestamp.getTime() - Date.now()) / (1000 * 60)),
                                    'minute'
                                  )}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1 ml-2">
                              {!notification.isRead && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markAsRead(notification.id)}
                                  className="h-6 w-6 p-0"
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteNotification(notification.id)}
                                className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          {notification.actionUrl && notification.actionLabel && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-2"
                              onClick={() => {
                                window.location.href = notification.actionUrl!
                                markAsRead(notification.id)
                              }}
                            >
                              {notification.actionLabel}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {filteredNotifications.length > maxVisible && (
              <div className="p-4 border-t text-center">
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/notifications'}>
                  View All ({filteredNotifications.length} total)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  )
}

export default NotificationSystem
export type { Notification, NotificationSystemProps }
