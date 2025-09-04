"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { RouteGuard } from "@/components/route-guard"
import EditorLayout from "@/components/layouts/editor-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, CalendarDaysIcon } from "@/components/ui/calendar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import {
  Clock,
  FileText,
  AlertTriangle,
  CheckCircle,
  Users,
  Calendar as CalendarIcon,
  Bell,
  Target,
  TrendingUp,
} from "lucide-react"

interface CalendarEvent {
  id: string
  title: string
  date: Date
  type: "review_deadline" | "decision_deadline" | "publication_deadline" | "meeting" | "reminder"
  status: "upcoming" | "overdue" | "completed"
  manuscriptId?: string
  description?: string
  priority: "low" | "medium" | "high" | "urgent"
}

interface DeadlineStats {
  totalUpcoming: number
  overdue: number
  dueToday: number
  dueThisWeek: number
}

export default function EditorCalendar() {
  const { data: session } = useSession()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [deadlineStats, setDeadlineStats] = useState<DeadlineStats>({
    totalUpcoming: 0,
    overdue: 0,
    dueToday: 0,
    dueThisWeek: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCalendarData()
  }, [])

  const loadCalendarData = async () => {
    try {
      setLoading(true)
      
      // Mock data for now - replace with actual API calls
      const mockEvents: CalendarEvent[] = [
        {
          id: "1",
          title: "Review Deadline: AI in Healthcare",
          date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
          type: "review_deadline",
          status: "upcoming",
          manuscriptId: "ms001",
          description: "Initial review deadline for manuscript submission",
          priority: "high"
        },
        {
          id: "2",
          title: "Editorial Decision Due: Smart Systems Review",
          date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
          type: "decision_deadline",
          status: "upcoming",
          manuscriptId: "ms002",
          description: "Final editorial decision required",
          priority: "urgent"
        },
        {
          id: "3",
          title: "Publication Deadline: Issue 2024-Q4",
          date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
          type: "publication_deadline",
          status: "upcoming",
          description: "Final deadline for Q4 2024 issue",
          priority: "medium"
        },
        {
          id: "4",
          title: "Editorial Board Meeting",
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          type: "meeting",
          status: "upcoming",
          description: "Monthly editorial board meeting",
          priority: "medium"
        },
        {
          id: "5",
          title: "Overdue Review: Machine Learning Applications",
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          type: "review_deadline",
          status: "overdue",
          manuscriptId: "ms003",
          description: "Review deadline has passed",
          priority: "urgent"
        }
      ]

      setEvents(mockEvents)

      // Calculate stats
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

      const stats = {
        totalUpcoming: mockEvents.filter(e => e.status === "upcoming").length,
        overdue: mockEvents.filter(e => e.status === "overdue").length,
        dueToday: mockEvents.filter(e => {
          const eventDate = new Date(e.date.getFullYear(), e.date.getMonth(), e.date.getDate())
          return eventDate.getTime() === today.getTime()
        }).length,
        dueThisWeek: mockEvents.filter(e => {
          const eventDate = new Date(e.date.getFullYear(), e.date.getMonth(), e.date.getDate())
          return eventDate >= today && eventDate <= weekFromNow
        }).length,
      }

      setDeadlineStats(stats)
    } catch (error) {
      console.error("Failed to load calendar data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getEventsByDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.date.getFullYear(), event.date.getMonth(), event.date.getDate())
      const selectedDateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      return eventDate.getTime() === selectedDateOnly.getTime()
    })
  }

  const getEventTypeIcon = (type: CalendarEvent["type"]) => {
    switch (type) {
      case "review_deadline":
        return <FileText className="h-4 w-4" />
      case "decision_deadline":
        return <CheckCircle className="h-4 w-4" />
      case "publication_deadline":
        return <Target className="h-4 w-4" />
      case "meeting":
        return <Users className="h-4 w-4" />
      case "reminder":
        return <Bell className="h-4 w-4" />
      default:
        return <CalendarIcon className="h-4 w-4" />
    }
  }

  const getEventTypeColor = (type: CalendarEvent["type"], status: CalendarEvent["status"]) => {
    if (status === "overdue") return "destructive"
    
    switch (type) {
      case "review_deadline":
        return "blue"
      case "decision_deadline":
        return "yellow"
      case "publication_deadline":
        return "green"
      case "meeting":
        return "purple"
      case "reminder":
        return "gray"
      default:
        return "default"
    }
  }

  const getPriorityColor = (priority: CalendarEvent["priority"]) => {
    switch (priority) {
      case "urgent":
        return "destructive"
      case "high":
        return "yellow"
      case "medium":
        return "blue"
      case "low":
        return "gray"
      default:
        return "default"
    }
  }

  const selectedDateEvents = getEventsByDate(selectedDate)

  if (loading) {
    return (
      <RouteGuard allowedRoles={["editor", "admin"]}>
        <EditorLayout>
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
          </div>
        </EditorLayout>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard allowedRoles={["editor", "admin"]}>
      <EditorLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Editorial Calendar</h1>
              <p className="text-muted-foreground">
                Manage deadlines, meetings, and important dates
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Deadlines</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{deadlineStats.totalUpcoming}</div>
                <p className="text-xs text-muted-foreground">Total upcoming events</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue Items</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{deadlineStats.overdue}</div>
                <p className="text-xs text-muted-foreground">Require immediate attention</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Due Today</CardTitle>
                <Target className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{deadlineStats.dueToday}</div>
                <p className="text-xs text-muted-foreground">Items due today</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Due This Week</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{deadlineStats.dueThisWeek}</div>
                <p className="text-xs text-muted-foreground">Items due in 7 days</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Calendar */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Calendar View</CardTitle>
                <CardDescription>
                  Click on a date to view events and deadlines
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>

            {/* Selected Date Events */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {format(selectedDate, "MMMM d, yyyy")}
                </CardTitle>
                <CardDescription>
                  {selectedDateEvents.length} event(s) on this date
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedDateEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No events scheduled for this date.</p>
                ) : (
                  selectedDateEvents.map((event) => (
                    <div key={event.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                      <div className="mt-1">
                        {getEventTypeIcon(event.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">{event.title}</h4>
                          <Badge variant={getPriorityColor(event.priority)} className="text-xs">
                            {event.priority}
                          </Badge>
                        </div>
                        {event.description && (
                          <p className="text-xs text-muted-foreground">{event.description}</p>
                        )}
                        <div className="flex items-center space-x-2">
                          <Badge variant={getEventTypeColor(event.type, event.status)} className="text-xs">
                            {event.type.replace("_", " ")}
                          </Badge>
                          {event.status === "overdue" && (
                            <Badge variant="destructive" className="text-xs">
                              Overdue
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* All Events List */}
          <Card>
            <CardHeader>
              <CardTitle>All Upcoming Events</CardTitle>
              <CardDescription>
                Complete list of deadlines and events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="upcoming" className="w-full">
                <TabsList>
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="overdue">Overdue</TabsTrigger>
                  <TabsTrigger value="all">All Events</TabsTrigger>
                </TabsList>
                
                <TabsContent value="upcoming" className="space-y-4">
                  {events
                    .filter(event => event.status === "upcoming")
                    .sort((a, b) => a.date.getTime() - b.date.getTime())
                    .map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          {getEventTypeIcon(event.type)}
                          <div>
                            <h4 className="font-medium">{event.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {format(event.date, "PPP")} • {event.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={getPriorityColor(event.priority)}>
                            {event.priority}
                          </Badge>
                          <Badge variant={getEventTypeColor(event.type, event.status)}>
                            {event.type.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </TabsContent>

                <TabsContent value="overdue" className="space-y-4">
                  {events
                    .filter(event => event.status === "overdue")
                    .sort((a, b) => a.date.getTime() - b.date.getTime())
                    .map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-4 rounded-lg border border-destructive">
                        <div className="flex items-center space-x-3">
                          {getEventTypeIcon(event.type)}
                          <div>
                            <h4 className="font-medium text-destructive">{event.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {format(event.date, "PPP")} • {event.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="destructive">Overdue</Badge>
                          <Badge variant={getEventTypeColor(event.type, event.status)}>
                            {event.type.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </TabsContent>

                <TabsContent value="all" className="space-y-4">
                  {events
                    .sort((a, b) => a.date.getTime() - b.date.getTime())
                    .map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          {getEventTypeIcon(event.type)}
                          <div>
                            <h4 className="font-medium">{event.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {format(event.date, "PPP")} • {event.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={getPriorityColor(event.priority)}>
                            {event.priority}
                          </Badge>
                          <Badge variant={getEventTypeColor(event.type, event.status)}>
                            {event.type.replace("_", " ")}
                          </Badge>
                          {event.status === "overdue" && (
                            <Badge variant="destructive">Overdue</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </EditorLayout>
    </RouteGuard>
  )
}