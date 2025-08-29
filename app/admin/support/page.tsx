"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  MessageCircle, 
  Users, 
  Clock, 
  TrendingUp,
  Settings,
  Bell,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle,
  Activity
} from "lucide-react"

export default function SupportDashboardPage() {
  // Mock data - in real app, fetch from your analytics API
  const supportStats = {
    totalChats: 1247,
    activeChats: 3,
    responseTime: "2.3 min",
    satisfaction: 4.7,
    onlineAgents: 2,
    totalAgents: 5
  }

  const recentChats = [
    {
      id: 1,
      visitor: "Dr. Sarah Johnson",
      topic: "Manuscript Submission",
      status: "active",
      duration: "5 min",
      agent: "Support Agent 1"
    },
    {
      id: 2,
      visitor: "Prof. Michael Chen",
      topic: "Peer Review Process",
      status: "closed",
      duration: "12 min",
      agent: "Support Agent 2"
    },
    {
      id: 3,
      visitor: "Anonymous",
      topic: "Technical Issue",
      status: "waiting",
      duration: "1 min",
      agent: "Unassigned"
    }
  ]

  const supportChannels = [
    {
      name: "Live Chat",
      status: "online",
      icon: MessageCircle,
      stats: "24 chats today",
      color: "text-green-600"
    },
    {
      name: "Email Support",
      status: "active",
      icon: Mail,
      stats: "18 emails pending",
      color: "text-blue-600"
    },
    {
      name: "Phone Support",
      status: "offline",
      icon: Phone,
      stats: "Business hours only",
      color: "text-gray-400"
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Support Dashboard</h1>
          <p className="text-gray-600">Monitor and manage customer support operations</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold text-gray-800">{supportStats.totalChats}</div>
              <div className="text-sm text-gray-600">Total Chats</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Activity className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-gray-800">{supportStats.activeChats}</div>
              <div className="text-sm text-gray-600">Active Now</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <div className="text-2xl font-bold text-gray-800">{supportStats.responseTime}</div>
              <div className="text-sm text-gray-600">Avg Response</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold text-gray-800">{supportStats.satisfaction}</div>
              <div className="text-sm text-gray-600">Satisfaction</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-indigo-600" />
              <div className="text-2xl font-bold text-gray-800">{supportStats.onlineAgents}</div>
              <div className="text-sm text-gray-600">Online Agents</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-teal-600" />
              <div className="text-2xl font-bold text-gray-800">{supportStats.totalAgents}</div>
              <div className="text-sm text-gray-600">Total Agents</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="chats">Active Chats</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Support Channels Status */}
            <Card>
              <CardHeader>
                <CardTitle>Support Channels</CardTitle>
                <CardDescription>Current status of all support channels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {supportChannels.map((channel, index) => (
                    <div key={index} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                      <channel.icon className={`h-6 w-6 ${channel.color}`} />
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">{channel.name}</div>
                        <div className="text-sm text-gray-600">{channel.stats}</div>
                      </div>
                      <Badge 
                        variant={channel.status === 'online' ? 'default' : channel.status === 'active' ? 'secondary' : 'outline'}
                        className={
                          channel.status === 'online' ? 'bg-green-100 text-green-800' :
                          channel.status === 'active' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-600'
                        }
                      >
                        {channel.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Support Activity</CardTitle>
                <CardDescription>Latest chat sessions and support requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentChats.map((chat) => (
                    <div key={chat.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          chat.status === 'active' ? 'bg-green-500' :
                          chat.status === 'waiting' ? 'bg-yellow-500' :
                          'bg-gray-400'
                        }`} />
                        <div>
                          <div className="font-medium text-gray-800">{chat.visitor}</div>
                          <div className="text-sm text-gray-600">{chat.topic}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-800">{chat.duration}</div>
                        <div className="text-sm text-gray-600">{chat.agent}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chats" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Chat Sessions</CardTitle>
                <CardDescription>Currently ongoing support conversations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-4">
                    Active chat sessions will appear here. To manage chats, use the Tawk.to dashboard.
                  </p>
                  <Button 
                    onClick={() => window.open('https://dashboard.tawk.to', '_blank')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Open Tawk.to Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Tawk.to Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Tawk.to Configuration
                  </CardTitle>
                  <CardDescription>Manage your Tawk.to integration settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <div className="flex items-center mt-1">
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Property ID</label>
                    <div className="mt-1 text-sm text-gray-600 font-mono bg-gray-50 p-2 rounded">
                      {process.env.NEXT_PUBLIC_TAWK_TO_PROPERTY_ID || 'Not configured'}
                    </div>
                  </div>

                  <Button 
                    onClick={() => window.open('https://dashboard.tawk.to', '_blank')}
                    className="w-full"
                    variant="outline"
                  >
                    Manage in Tawk.to Dashboard
                  </Button>
                </CardContent>
              </Card>

              {/* Notification Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="h-5 w-5 mr-2" />
                    Notification Settings
                  </CardTitle>
                  <CardDescription>Configure support notification preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span className="text-sm">Email notifications for new chats</span>
                    </label>
                    
                    <label className="flex items-center space-x-3">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span className="text-sm">SMS alerts for urgent issues</span>
                    </label>
                    
                    <label className="flex items-center space-x-3">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Daily summary reports</span>
                    </label>
                  </div>

                  <Button className="w-full mt-4">
                    Save Preferences
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Integration Info */}
            <Card>
              <CardHeader>
                <CardTitle>Integration Information</CardTitle>
                <CardDescription>Technical details about your support system integration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-3">Features Enabled</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                        Live chat widget
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                        Floating support button
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                        Mobile responsive
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                        Offline message support
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-800 mb-3">Support Channels</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Live Chat: 24/7 Available</li>
                      <li>• Email: support@amhsj.org</li>
                      <li>• Phone: +1 (555) 0123</li>
                      <li>• Help Center: /support</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
