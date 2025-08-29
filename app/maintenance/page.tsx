"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Settings, 
  Clock, 
  Mail, 
  Twitter, 
  Facebook, 
  Linkedin,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Phone
} from "lucide-react"

interface MaintenanceInfo {
  title: string
  message: string
  estimatedDuration: string
  startTime: string
  endTime: string
  reason: string
  affectedServices: string[]
  contactEmail: string
  updates: {
    time: string
    message: string
    type: 'info' | 'warning' | 'success'
  }[]
}

export default function MaintenancePage() {
  const [timeRemaining, setTimeRemaining] = useState("")
  const [email, setEmail] = useState("")
  const [subscribed, setSubscribed] = useState(false)
  const [maintenanceInfo] = useState<MaintenanceInfo>({
    title: "Scheduled System Maintenance",
    message: "We're performing important system upgrades to improve your experience with AMHSJ platform.",
    estimatedDuration: "2-4 hours",
    startTime: "2025-08-08T02:00:00Z",
    endTime: "2025-08-08T06:00:00Z",
    reason: "Database optimization and security updates",
    affectedServices: [
      "Article submission system",
      "Peer review dashboard", 
      "User authentication",
      "File uploads",
      "Email notifications"
    ],
    contactEmail: "support@amhsj.org",
    updates: [
      {
        time: "2025-08-08T02:00:00Z",
        message: "Maintenance has begun. All services are temporarily unavailable.",
        type: "info"
      },
      {
        time: "2025-08-08T03:30:00Z", 
        message: "Database optimization completed. Proceeding with security updates.",
        type: "success"
      },
      {
        time: "2025-08-08T04:15:00Z",
        message: "Security updates in progress. Services will be restored shortly.",
        type: "warning"
      }
    ]
  })

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const endTime = new Date(maintenanceInfo.endTime)
      const now = new Date()
      const diff = endTime.getTime() - now.getTime()

      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        setTimeRemaining(`${hours}h ${minutes}m`)
      } else {
        setTimeRemaining("Maintenance should be completed")
      }
    }

    calculateTimeRemaining()
    const interval = setInterval(calculateTimeRemaining, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [maintenanceInfo.endTime])

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    // Simulate subscription
    setSubscribed(true)
    
    // In production, this would call an API
    try {
      await fetch('/api/maintenance/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Subscription API not available during maintenance')
      }
    }
  }

  const getUpdateIcon = (type: 'info' | 'warning' | 'success') => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default:
        return <Clock className="h-4 w-4 text-blue-600" />
    }
  }

  const getUpdateColor = (type: 'info' | 'warning' | 'success') => {
    switch (type) {
      case 'success':
        return 'border-l-green-500 bg-green-50'
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50'
      default:
        return 'border-l-blue-500 bg-blue-50'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/maintenance-pattern.svg')] opacity-5"></div>
      
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="max-w-4xl w-full space-y-8">
          
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-full shadow-lg">
                <Settings className="h-12 w-12 text-white animate-spin" style={{ animationDuration: '3s' }} />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2">
              {maintenanceInfo.title}
            </h1>
            
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              {maintenanceInfo.message}
            </p>
            
            <div className="bg-blue-100 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
              <div className="flex items-center justify-center space-x-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-blue-800">
                  Estimated time remaining: {timeRemaining}
                </span>
              </div>
              <div className="mt-2 text-xs text-blue-600">
                🌐 Running on Vercel Edge Network
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Maintenance Details */}
            <Card className="shadow-xl border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl text-gray-800 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
                  Maintenance Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Reason for Maintenance</h4>
                  <p className="text-gray-600">{maintenanceInfo.reason}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Affected Services</h4>
                  <ul className="space-y-1">
                    {maintenanceInfo.affectedServices.map((service, index) => (
                      <li key={index} className="flex items-center text-gray-600">
                        <span className="w-2 h-2 bg-red-400 rounded-full mr-3"></span>
                        {service}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Timeline</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Start:</span>
                      <span className="font-medium">
                        {new Date(maintenanceInfo.startTime).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Expected End:</span>
                      <span className="font-medium">
                        {new Date(maintenanceInfo.endTime).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">{maintenanceInfo.estimatedDuration}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Live Updates */}
            <Card className="shadow-xl border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl text-gray-800 flex items-center">
                  <RefreshCw className="h-5 w-5 mr-2 text-blue-500" />
                  Live Updates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {maintenanceInfo.updates.map((update, index) => (
                    <div 
                      key={index} 
                      className={`p-3 rounded-lg border-l-4 ${getUpdateColor(update.type)}`}
                    >
                      <div className="flex items-start space-x-3">
                        {getUpdateIcon(update.type)}
                        <div className="flex-1">
                          <div className="text-sm text-gray-500 mb-1">
                            {new Date(update.time).toLocaleTimeString()}
                          </div>
                          <p className="text-sm text-gray-700">{update.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This page will automatically refresh when services are restored.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>

          {/* Notification Signup */}
          <Card className="shadow-xl border-0 bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl text-gray-800 flex items-center justify-center">
                <Mail className="h-5 w-5 mr-2 text-green-500" />
                Get Notified When We're Back
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!subscribed ? (
                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1"
                  />
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">
                    Notify Me
                  </Button>
                </form>
              ) : (
                <div className="text-center">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-green-700 font-medium">
                    Thanks! We'll email you when services are restored.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact & Social */}
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Contact Information */}
            <Card className="shadow-xl border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg text-gray-800">Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-700">Email Support</p>
                    <a 
                      href={`mailto:${maintenanceInfo.contactEmail}`}
                      className="text-blue-600 hover:underline"
                    >
                      {maintenanceInfo.contactEmail}
                    </a>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-700">Emergency Contact</p>
                    <p className="text-gray-600">+1 (555) 123-4567</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Social Links */}
            <Card className="shadow-xl border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg text-gray-800">Stay Connected</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-4">
                  <a 
                    href="https://twitter.com/amhsj" 
                    className="p-3 bg-blue-100 hover:bg-blue-200 rounded-full transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Twitter className="h-5 w-5 text-blue-600" />
                  </a>
                  <a 
                    href="https://facebook.com/amhsj" 
                    className="p-3 bg-blue-100 hover:bg-blue-200 rounded-full transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Facebook className="h-5 w-5 text-blue-600" />
                  </a>
                  <a 
                    href="https://linkedin.com/company/amhsj" 
                    className="p-3 bg-blue-100 hover:bg-blue-200 rounded-full transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Linkedin className="h-5 w-5 text-blue-600" />
                  </a>
                </div>
                <p className="text-sm text-gray-600 mt-3">
                  Follow us for real-time updates and announcements
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Footer */}
          <div className="text-center text-gray-500 text-sm">
            <p>&copy; 2025 Advances in Medicine and Health Sciences Journal</p>
            <p className="mt-1">We appreciate your patience during this maintenance window</p>
          </div>
        </div>
      </div>
    </div>
  )
}
