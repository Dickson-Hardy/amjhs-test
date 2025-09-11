"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { RouteGuard } from "@/components/route-guard"
import AdminLayout from "@/components/layouts/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import {
  Settings,
  Database,
  Mail,
  Shield,
  Globe,
  FileText,
  Upload,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Server,
  Activity,
  Lock,
  Key,
  Users,
  Bell
} from "lucide-react"

interface SystemConfig {
  general: {
    siteName: string
    siteUrl: string
    adminEmail: string
    maintenanceMode: boolean
    allowRegistration: boolean
    requireEmailVerification: boolean
  }
  email: {
    smtpHost: string
    smtpPort: number
    smtpSecure: boolean
    smtpUser: string
    smtpPassword: string
    fromName: string
    fromEmail: string
  }
  security: {
    sessionTimeout: number
    maxLoginAttempts: number
    passwordMinLength: number
    requireStrongPasswords: boolean
    enableTwoFactor: boolean
    allowedDomains: string[]
  }
  review: {
    defaultReviewDeadline: number
    reminderDays: number
    autoExtendDays: number
    maxReviewers: number
    allowSelfAssignment: boolean
  }
  publication: {
    autoPublish: boolean
    embargoMonths: number
    doiPrefix: string
    issn: string
    copyrightNotice: string
  }
}

interface SystemHealth {
  database: {
    status: "healthy" | "warning" | "error"
    latency: number
    connections: number
  }
  email: {
    status: "healthy" | "warning" | "error"
    lastSent: string
    queueSize: number
  }
  storage: {
    status: "healthy" | "warning" | "error"
    usage: number
    totalSpace: number
  }
  application: {
    status: "healthy" | "warning" | "error"
    uptime: string
    memoryUsage: number
  }
}

export default function AdminSystemPage() {
  const { data: session } = useSession()
  const router = useRouter()
  
  const [config, setConfig] = useState<SystemConfig | null>(null)
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("general")

  useEffect(() => {
    fetchSystemData()
  }, [])

  const fetchSystemData = async () => {
    try {
      setLoading(true)
      const [configRes, healthRes] = await Promise.all([
        fetch('/api/admin/system/config'),
        fetch('/api/admin/system/health')
      ])
      
      if (configRes.ok) {
        const configData = await configRes.json()
        setConfig(configData.config)
      }
      
      if (healthRes.ok) {
        const healthData = await healthRes.json()
        setHealth(healthData.health)
      }
    } catch (error) {
      console.error('Error fetching system data:', error)
      toast.error('Failed to fetch system configuration')
    } finally {
      setLoading(false)
    }
  }

  const handleConfigUpdate = async (section: string, updates: any) => {
    try {
      setSaving(true)
      const response = await fetch('/api/admin/system/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, updates })
      })
      
      if (response.ok) {
        toast.success('Configuration updated successfully')
        setConfig(prev => prev ? { ...prev, [section]: { ...prev[section as keyof SystemConfig], ...updates } } : null)
      } else {
        toast.error('Failed to update configuration')
      }
    } catch (error) {
      console.error('Error updating configuration:', error)
      toast.error('Failed to update configuration')
    } finally {
      setSaving(false)
    }
  }

  const testEmailConfig = async () => {
    try {
      const response = await fetch('/api/admin/system/test-email', { method: 'POST' })
      if (response.ok) {
        toast.success('Test email sent successfully')
      } else {
        toast.error('Failed to send test email')
      }
    } catch (error) {
      console.error('Error testing email:', error)
      toast.error('Failed to test email configuration')
    }
  }

  const performBackup = async () => {
    try {
      const response = await fetch('/api/admin/system/backup', { method: 'POST' })
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `backup-${new Date().toISOString().split('T')[0]}.zip`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        toast.success('Backup created successfully')
      } else {
        toast.error('Failed to create backup')
      }
    } catch (error) {
      console.error('Error creating backup:', error)
      toast.error('Failed to create backup')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy": return "text-green-600 bg-green-100"
      case "warning": return "text-yellow-600 bg-yellow-100"
      case "error": return "text-red-600 bg-red-100"
      default: return "text-gray-600 bg-gray-100"
    }
  }

  if (loading) {
    return (
      <RouteGuard allowedRoles={["admin"]}>
        <AdminLayout>
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </AdminLayout>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard allowedRoles={["admin"]}>
      <AdminLayout>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">System Management</h1>
            <p className="text-slate-600 mt-2">Configure system settings and monitor health</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={performBackup}>
              <Download className="h-4 w-4 mr-2" />
              Create Backup
            </Button>
            <Button variant="outline" onClick={fetchSystemData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* System Health */}
        {health && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Database</p>
                    <p className="text-lg font-semibold">{health.database.latency}ms</p>
                    <Badge className={getStatusColor(health.database.status)} variant="outline">
                      {health.database.status}
                    </Badge>
                  </div>
                  <Database className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Email System</p>
                    <p className="text-lg font-semibold">Queue: {health.email.queueSize}</p>
                    <Badge className={getStatusColor(health.email.status)} variant="outline">
                      {health.email.status}
                    </Badge>
                  </div>
                  <Mail className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Storage</p>
                    <p className="text-lg font-semibold">{((health.storage.usage / health.storage.totalSpace) * 100).toFixed(1)}%</p>
                    <Badge className={getStatusColor(health.storage.status)} variant="outline">
                      {health.storage.status}
                    </Badge>
                  </div>
                  <Server className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Application</p>
                    <p className="text-lg font-semibold">Up {health.application.uptime}</p>
                    <Badge className={getStatusColor(health.application.status)} variant="outline">
                      {health.application.status}
                    </Badge>
                  </div>
                  <Activity className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Configuration Tabs */}
        {config && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="review">Review</TabsTrigger>
              <TabsTrigger value="publication">Publication</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="siteName">Site Name</Label>
                      <Input
                        id="siteName"
                        value={config.general.siteName}
                        onChange={(e) => setConfig(prev => prev ? { ...prev, general: { ...prev.general, siteName: e.target.value } } : null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="siteUrl">Site URL</Label>
                      <Input
                        id="siteUrl"
                        value={config.general.siteUrl}
                        onChange={(e) => setConfig(prev => prev ? { ...prev, general: { ...prev.general, siteUrl: e.target.value } } : null)}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="adminEmail">Admin Email</Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      value={config.general.adminEmail}
                      onChange={(e) => setConfig(prev => prev ? { ...prev, general: { ...prev.general, adminEmail: e.target.value } } : null)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Maintenance Mode</Label>
                      <p className="text-sm text-gray-600">Temporarily disable site access</p>
                    </div>
                    <Switch
                      checked={config.general.maintenanceMode}
                      onCheckedChange={(checked) => setConfig(prev => prev ? { ...prev, general: { ...prev.general, maintenanceMode: checked } } : null)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow Registration</Label>
                      <p className="text-sm text-gray-600">Allow new user registration</p>
                    </div>
                    <Switch
                      checked={config.general.allowRegistration}
                      onCheckedChange={(checked) => setConfig(prev => prev ? { ...prev, general: { ...prev.general, allowRegistration: checked } } : null)}
                    />
                  </div>

                  <Button onClick={() => handleConfigUpdate('general', config.general)} disabled={saving}>
                    {saving ? 'Saving...' : 'Save General Settings'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="email" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Email Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="smtpHost">SMTP Host</Label>
                      <Input
                        id="smtpHost"
                        value={config.email.smtpHost}
                        onChange={(e) => setConfig(prev => prev ? { ...prev, email: { ...prev.email, smtpHost: e.target.value } } : null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtpPort">SMTP Port</Label>
                      <Input
                        id="smtpPort"
                        type="number"
                        value={config.email.smtpPort}
                        onChange={(e) => setConfig(prev => prev ? { ...prev, email: { ...prev.email, smtpPort: parseInt(e.target.value) } } : null)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="smtpUser">SMTP Username</Label>
                      <Input
                        id="smtpUser"
                        value={config.email.smtpUser}
                        onChange={(e) => setConfig(prev => prev ? { ...prev, email: { ...prev.email, smtpUser: e.target.value } } : null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtpPassword">SMTP Password</Label>
                      <Input
                        id="smtpPassword"
                        type="password"
                        value={config.email.smtpPassword}
                        onChange={(e) => setConfig(prev => prev ? { ...prev, email: { ...prev.email, smtpPassword: e.target.value } } : null)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Button onClick={() => handleConfigUpdate('email', config.email)} disabled={saving}>
                      {saving ? 'Saving...' : 'Save Email Settings'}
                    </Button>
                    <Button variant="outline" onClick={testEmailConfig}>
                      <Mail className="h-4 w-4 mr-2" />
                      Test Email
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                      <Input
                        id="sessionTimeout"
                        type="number"
                        value={config.security.sessionTimeout}
                        onChange={(e) => setConfig(prev => prev ? { ...prev, security: { ...prev.security, sessionTimeout: parseInt(e.target.value) } } : null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                      <Input
                        id="maxLoginAttempts"
                        type="number"
                        value={config.security.maxLoginAttempts}
                        onChange={(e) => setConfig(prev => prev ? { ...prev, security: { ...prev.security, maxLoginAttempts: parseInt(e.target.value) } } : null)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Two-Factor Authentication</Label>
                      <p className="text-sm text-gray-600">Require 2FA for admin accounts</p>
                    </div>
                    <Switch
                      checked={config.security.enableTwoFactor}
                      onCheckedChange={(checked) => setConfig(prev => prev ? { ...prev, security: { ...prev.security, enableTwoFactor: checked } } : null)}
                    />
                  </div>

                  <Button onClick={() => handleConfigUpdate('security', config.security)} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Security Settings'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="review" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Review Process Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="defaultReviewDeadline">Default Review Deadline (days)</Label>
                      <Input
                        id="defaultReviewDeadline"
                        type="number"
                        value={config.review.defaultReviewDeadline}
                        onChange={(e) => setConfig(prev => prev ? { ...prev, review: { ...prev.review, defaultReviewDeadline: parseInt(e.target.value) } } : null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxReviewers">Maximum Reviewers</Label>
                      <Input
                        id="maxReviewers"
                        type="number"
                        value={config.review.maxReviewers}
                        onChange={(e) => setConfig(prev => prev ? { ...prev, review: { ...prev.review, maxReviewers: parseInt(e.target.value) } } : null)}
                      />
                    </div>
                  </div>

                  <Button onClick={() => handleConfigUpdate('review', config.review)} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Review Settings'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="publication" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Publication Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="doiPrefix">DOI Prefix</Label>
                      <Input
                        id="doiPrefix"
                        value={config.publication.doiPrefix}
                        onChange={(e) => setConfig(prev => prev ? { ...prev, publication: { ...prev.publication, doiPrefix: e.target.value } } : null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="issn">ISSN</Label>
                      <Input
                        id="issn"
                        value={config.publication.issn}
                        onChange={(e) => setConfig(prev => prev ? { ...prev, publication: { ...prev.publication, issn: e.target.value } } : null)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="copyrightNotice">Copyright Notice</Label>
                    <Textarea
                      id="copyrightNotice"
                      value={config.publication.copyrightNotice}
                      onChange={(e) => setConfig(prev => prev ? { ...prev, publication: { ...prev.publication, copyrightNotice: e.target.value } } : null)}
                    />
                  </div>

                  <Button onClick={() => handleConfigUpdate('publication', config.publication)} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Publication Settings'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </AdminLayout>
    </RouteGuard>
  )
}