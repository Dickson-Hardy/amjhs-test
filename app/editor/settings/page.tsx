"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { RouteGuard } from "@/components/route-guard"
import EditorLayout from "@/components/layouts/editor-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Settings,
  Bell,
  Clock,
  Mail,
  Shield,
  User,
  Workflow,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
} from "lucide-react"

interface EditorSettings {
  // Notification preferences
  emailNotifications: {
    newSubmissions: boolean
    reviewCompleted: boolean
    deadlineReminders: boolean
    systemUpdates: boolean
    weeklyDigest: boolean
  }
  // Workflow settings
  workflow: {
    autoAssignReviewers: boolean
    reviewDeadlineDays: number
    revisionDeadlineDays: number
    reminderFrequency: number
    requireMinimumReviewers: number
    enableQuickDecisions: boolean
  }
  // Editorial preferences
  editorial: {
    defaultCategory: string
    preferredReviewerTypes: string[]
    decisionTemplates: boolean
    conflictOfInterestCheck: boolean
    plagiarismCheck: boolean
  }
  // Interface settings
  interface: {
    theme: string
    language: string
    timezone: string
    itemsPerPage: number
    showAdvancedFeatures: boolean
  }
}

export default function EditorSettingsPage() {
  const { data: session } = useSession()
  const [settings, setSettings] = useState<EditorSettings>({
    emailNotifications: {
      newSubmissions: true,
      reviewCompleted: true,
      deadlineReminders: true,
      systemUpdates: false,
      weeklyDigest: true
    },
    workflow: {
      autoAssignReviewers: false,
      reviewDeadlineDays: 21,
      revisionDeadlineDays: 30,
      reminderFrequency: 7,
      requireMinimumReviewers: 2,
      enableQuickDecisions: true
    },
    editorial: {
      defaultCategory: "ai-machine-learning",
      preferredReviewerTypes: ["academic", "industry"],
      decisionTemplates: true,
      conflictOfInterestCheck: true,
      plagiarismCheck: true
    },
    interface: {
      theme: "light",
      language: "en",
      timezone: "UTC",
      itemsPerPage: 20,
      showAdvancedFeatures: false
    }
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/editor/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings || settings) // Keep defaults if no settings returned
      } else {
        console.error('Failed to fetch settings')
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/editor/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      
      if (response.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        console.error('Failed to save settings')
      }
    } catch (error) {
      console.error("Error saving settings:", error)
    } finally {
      setSaving(false)
    }
  }

  const resetToDefaults = () => {
    setSettings({
      emailNotifications: {
        newSubmissions: true,
        reviewCompleted: true,
        deadlineReminders: true,
        systemUpdates: false,
        weeklyDigest: true
      },
      workflow: {
        autoAssignReviewers: false,
        reviewDeadlineDays: 21,
        revisionDeadlineDays: 30,
        reminderFrequency: 7,
        requireMinimumReviewers: 2,
        enableQuickDecisions: true
      },
      editorial: {
        defaultCategory: "ai-machine-learning",
        preferredReviewerTypes: ["academic", "industry"],
        decisionTemplates: true,
        conflictOfInterestCheck: true,
        plagiarismCheck: true
      },
      interface: {
        theme: "light",
        language: "en",
        timezone: "UTC",
        itemsPerPage: 20,
        showAdvancedFeatures: false
      }
    })
  }

  const updateSetting = (section: keyof EditorSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }))
  }

  if (loading) {
    return (
      <RouteGuard allowedRoles={["editor", "admin"]}>
        <EditorLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        </EditorLayout>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard allowedRoles={["editor", "admin"]}>
      <EditorLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Editorial Settings</h1>
              <p className="text-gray-600">Configure your editorial workflow and preferences</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={resetToDefaults}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset to Defaults
              </Button>
              <Button onClick={saveSettings} disabled={saving}>
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                ) : saved ? (
                  <CheckCircle className="w-4 h-4 mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
              </Button>
            </div>
          </div>

          <Tabs defaultValue="notifications" className="space-y-6">
            <TabsList>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="workflow">Workflow</TabsTrigger>
              <TabsTrigger value="editorial">Editorial</TabsTrigger>
              <TabsTrigger value="interface">Interface</TabsTrigger>
            </TabsList>

            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Email Notifications
                  </CardTitle>
                  <CardDescription>
                    Configure when you want to receive email notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="new-submissions">New Submissions</Label>
                      <p className="text-sm text-gray-500">Get notified when new manuscripts are submitted</p>
                    </div>
                    <Switch
                      id="new-submissions"
                      checked={settings.emailNotifications.newSubmissions}
                      onCheckedChange={(checked) => updateSetting('emailNotifications', 'newSubmissions', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="review-completed">Reviews Completed</Label>
                      <p className="text-sm text-gray-500">Get notified when reviewers complete their reviews</p>
                    </div>
                    <Switch
                      id="review-completed"
                      checked={settings.emailNotifications.reviewCompleted}
                      onCheckedChange={(checked) => updateSetting('emailNotifications', 'reviewCompleted', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="deadline-reminders">Deadline Reminders</Label>
                      <p className="text-sm text-gray-500">Get reminders about upcoming deadlines</p>
                    </div>
                    <Switch
                      id="deadline-reminders"
                      checked={settings.emailNotifications.deadlineReminders}
                      onCheckedChange={(checked) => updateSetting('emailNotifications', 'deadlineReminders', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="system-updates">System Updates</Label>
                      <p className="text-sm text-gray-500">Get notified about system maintenance and updates</p>
                    </div>
                    <Switch
                      id="system-updates"
                      checked={settings.emailNotifications.systemUpdates}
                      onCheckedChange={(checked) => updateSetting('emailNotifications', 'systemUpdates', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="weekly-digest">Weekly Digest</Label>
                      <p className="text-sm text-gray-500">Receive a weekly summary of editorial activities</p>
                    </div>
                    <Switch
                      id="weekly-digest"
                      checked={settings.emailNotifications.weeklyDigest}
                      onCheckedChange={(checked) => updateSetting('emailNotifications', 'weeklyDigest', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="workflow" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Workflow className="w-5 h-5" />
                    Workflow Configuration
                  </CardTitle>
                  <CardDescription>
                    Set up your editorial workflow preferences and automation rules
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="review-deadline">Review Deadline (Days)</Label>
                      <Input
                        id="review-deadline"
                        type="number"
                        value={settings.workflow.reviewDeadlineDays}
                        onChange={(e) => updateSetting('workflow', 'reviewDeadlineDays', parseInt(e.target.value))}
                        min="7"
                        max="60"
                      />
                      <p className="text-sm text-gray-500 mt-1">Default deadline for peer reviews</p>
                    </div>

                    <div>
                      <Label htmlFor="revision-deadline">Revision Deadline (Days)</Label>
                      <Input
                        id="revision-deadline"
                        type="number"
                        value={settings.workflow.revisionDeadlineDays}
                        onChange={(e) => updateSetting('workflow', 'revisionDeadlineDays', parseInt(e.target.value))}
                        min="14"
                        max="90"
                      />
                      <p className="text-sm text-gray-500 mt-1">Default deadline for author revisions</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="reminder-frequency">Reminder Frequency (Days)</Label>
                      <Input
                        id="reminder-frequency"
                        type="number"
                        value={settings.workflow.reminderFrequency}
                        onChange={(e) => updateSetting('workflow', 'reminderFrequency', parseInt(e.target.value))}
                        min="1"
                        max="14"
                      />
                      <p className="text-sm text-gray-500 mt-1">How often to send reminder emails</p>
                    </div>

                    <div>
                      <Label htmlFor="minimum-reviewers">Minimum Reviewers</Label>
                      <Input
                        id="minimum-reviewers"
                        type="number"
                        value={settings.workflow.requireMinimumReviewers}
                        onChange={(e) => updateSetting('workflow', 'requireMinimumReviewers', parseInt(e.target.value))}
                        min="2"
                        max="5"
                      />
                      <p className="text-sm text-gray-500 mt-1">Required minimum number of reviewers</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="auto-assign">Auto-assign Reviewers</Label>
                        <p className="text-sm text-gray-500">Automatically suggest reviewers based on expertise matching</p>
                      </div>
                      <Switch
                        id="auto-assign"
                        checked={settings.workflow.autoAssignReviewers}
                        onCheckedChange={(checked) => updateSetting('workflow', 'autoAssignReviewers', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="quick-decisions">Enable Quick Decisions</Label>
                        <p className="text-sm text-gray-500">Allow streamlined decision-making for clear cases</p>
                      </div>
                      <Switch
                        id="quick-decisions"
                        checked={settings.workflow.enableQuickDecisions}
                        onCheckedChange={(checked) => updateSetting('workflow', 'enableQuickDecisions', checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="editorial" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Editorial Preferences
                  </CardTitle>
                  <CardDescription>
                    Configure your editorial policies and quality assurance settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="default-category">Default Manuscript Category</Label>
                    <Select
                      value={settings.editorial.defaultCategory}
                      onValueChange={(value) => updateSetting('editorial', 'defaultCategory', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ai-machine-learning">AI & Machine Learning</SelectItem>
                        <SelectItem value="human-computer-interaction">Human-Computer Interaction</SelectItem>
                        <SelectItem value="computer-security">Computer Security</SelectItem>
                        <SelectItem value="software-engineering">Software Engineering</SelectItem>
                        <SelectItem value="data-science">Data Science</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-500 mt-1">Primary category for your editorial scope</p>
                  </div>

                  <div>
                    <Label htmlFor="preferred-reviewers">Preferred Reviewer Types</Label>
                    <div className="flex gap-2 mt-2">
                      {["academic", "industry", "government", "independent"].map((type) => (
                        <Badge
                          key={type}
                          variant={settings.editorial.preferredReviewerTypes.includes(type) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => {
                            const current = settings.editorial.preferredReviewerTypes
                            const updated = current.includes(type)
                              ? current.filter(t => t !== type)
                              : [...current, type]
                            updateSetting('editorial', 'preferredReviewerTypes', updated)
                          }}
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Types of reviewers you prefer to work with</p>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="decision-templates">Decision Templates</Label>
                        <p className="text-sm text-gray-500">Use predefined templates for editorial decisions</p>
                      </div>
                      <Switch
                        id="decision-templates"
                        checked={settings.editorial.decisionTemplates}
                        onCheckedChange={(checked) => updateSetting('editorial', 'decisionTemplates', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="coi-check">Conflict of Interest Check</Label>
                        <p className="text-sm text-gray-500">Automatically check for potential conflicts of interest</p>
                      </div>
                      <Switch
                        id="coi-check"
                        checked={settings.editorial.conflictOfInterestCheck}
                        onCheckedChange={(checked) => updateSetting('editorial', 'conflictOfInterestCheck', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="plagiarism-check">Plagiarism Check</Label>
                        <p className="text-sm text-gray-500">Enable automatic plagiarism detection for submissions</p>
                      </div>
                      <Switch
                        id="plagiarism-check"
                        checked={settings.editorial.plagiarismCheck}
                        onCheckedChange={(checked) => updateSetting('editorial', 'plagiarismCheck', checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="interface" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Interface Settings
                  </CardTitle>
                  <CardDescription>
                    Customize your editorial dashboard interface and display preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="theme">Theme</Label>
                      <Select
                        value={settings.interface.theme}
                        onValueChange={(value) => updateSetting('interface', 'theme', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="auto">Auto (System)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="language">Language</Label>
                      <Select
                        value={settings.interface.language}
                        onValueChange={(value) => updateSetting('interface', 'language', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Español</SelectItem>
                          <SelectItem value="fr">Français</SelectItem>
                          <SelectItem value="de">Deutsch</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select
                        value={settings.interface.timezone}
                        onValueChange={(value) => updateSetting('interface', 'timezone', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="EST">Eastern Time</SelectItem>
                          <SelectItem value="PST">Pacific Time</SelectItem>
                          <SelectItem value="GMT">Greenwich Mean Time</SelectItem>
                          <SelectItem value="CET">Central European Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="items-per-page">Items per Page</Label>
                      <Select
                        value={settings.interface.itemsPerPage.toString()}
                        onValueChange={(value) => updateSetting('interface', 'itemsPerPage', parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="advanced-features">Show Advanced Features</Label>
                      <p className="text-sm text-gray-500">Display advanced editorial tools and options</p>
                    </div>
                    <Switch
                      id="advanced-features"
                      checked={settings.interface.showAdvancedFeatures}
                      onCheckedChange={(checked) => updateSetting('interface', 'showAdvancedFeatures', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </EditorLayout>
    </RouteGuard>
  )
}