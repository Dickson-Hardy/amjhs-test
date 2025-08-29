"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { RouteGuard } from "@/components/route-guard"
import AuthorLayout from "@/components/layouts/author-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Settings,
  Bell,
  Mail,
  Shield,
  Globe,
  FileText,
  User,
  Save,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  EyeOff
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface UserPreferences {
  id: string
  emailPreferences: EmailPreferences
  submissionDefaults: SubmissionDefaults
  privacySettings: PrivacySettings
  languageSettings: LanguageSettings
  notificationSettings: NotificationSettings
}

interface EmailPreferences {
  submissionUpdates: boolean
  reviewRequests: boolean
  publicationAlerts: boolean
  newsletter: boolean
  marketing: boolean
  digest: boolean
  digestFrequency: "daily" | "weekly" | "monthly"
}

interface SubmissionDefaults {
  defaultCategory: string
  defaultKeywords: string[]
  defaultAbstract: string
  autoSave: boolean
  autoSaveInterval: number
  defaultLanguage: string
}

interface PrivacySettings {
  profileVisibility: "public" | "private" | "authors_only"
  showEmail: boolean
  showPhone: boolean
  showInstitution: boolean
  allowContact: boolean
}

interface LanguageSettings {
  interfaceLanguage: string
  submissionLanguage: string
  preferredReviewLanguage: string
}

interface NotificationSettings {
  browserNotifications: boolean
  emailNotifications: boolean
  smsNotifications: boolean
  quietHours: boolean
  quietHoursStart: string
  quietHoursEnd: string
}

export default function AuthorPreferencesPage() {
  const { data: session } = useSession()
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })

  useEffect(() => {
    if (session?.user?.id) {
      fetchPreferences()
    }
  }, [session?.user?.id])

  const fetchPreferences = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/user/preferences`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setPreferences(data.preferences)
        }
      }
    } catch (error) {
      console.error("Error fetching preferences:", error)
      toast({
        title: "Error",
        description: "Failed to load preferences",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSavePreferences = async () => {
    try {
      setSaving(true)
      const response = await fetch(`/api/user/preferences`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences)
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Preferences saved successfully"
        })
      } else {
        throw new Error("Failed to save preferences")
      }
    } catch (error) {
      console.error("Error saving preferences:", error)
      toast({
        title: "Error",
        description: "Failed to save preferences",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords don't match",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch(`/api/user/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Password changed successfully"
        })
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
      } else {
        throw new Error("Failed to change password")
      }
    } catch (error) {
      console.error("Error changing password:", error)
      toast({
        title: "Error",
        description: "Failed to change password",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <RouteGuard allowedRoles={["author"]}>
        <AuthorLayout>
          <div className="space-y-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </AuthorLayout>
      </RouteGuard>
    )
  }

  if (!preferences) {
    return (
      <RouteGuard allowedRoles={["author"]}>
        <AuthorLayout>
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2">Preferences Not Found</h2>
            <p className="text-gray-600 mb-4">Unable to load your preferences.</p>
            <Button onClick={fetchPreferences}>Try Again</Button>
          </div>
        </AuthorLayout>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard allowedRoles={["author"]}>
      <AuthorLayout>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Account Preferences</h1>
              <p className="text-slate-600">Customize your account settings and preferences</p>
            </div>
            <Button onClick={handleSavePreferences} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="submission">Submission Defaults</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="language">Language</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Email Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Submission Updates</Label>
                      <p className="text-sm text-gray-600">Get notified about your manuscript status changes</p>
                    </div>
                    <Switch
                      checked={preferences.emailPreferences.submissionUpdates}
                      onCheckedChange={(checked) => setPreferences({
                        ...preferences,
                        emailPreferences: {
                          ...preferences.emailPreferences,
                          submissionUpdates: checked
                        }
                      })}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Review Requests</Label>
                      <p className="text-sm text-gray-600">Receive invitations to review manuscripts</p>
                    </div>
                    <Switch
                      checked={preferences.emailPreferences.reviewRequests}
                      onCheckedChange={(checked) => setPreferences({
                        ...preferences,
                        emailPreferences: {
                          ...preferences.emailPreferences,
                          reviewRequests: checked
                        }
                      })}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Publication Alerts</Label>
                      <p className="text-sm text-gray-600">Stay updated on new publications in your field</p>
                    </div>
                    <Switch
                      checked={preferences.emailPreferences.publicationAlerts}
                      onCheckedChange={(checked) => setPreferences({
                        ...preferences,
                        emailPreferences: {
                          ...preferences.emailPreferences,
                          publicationAlerts: checked
                        }
                      })}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Newsletter</Label>
                      <p className="text-sm text-gray-600">Receive our monthly journal newsletter</p>
                    </div>
                    <Switch
                      checked={preferences.emailPreferences.newsletter}
                      onCheckedChange={(checked) => setPreferences({
                        ...preferences,
                        emailPreferences: {
                          ...preferences.emailPreferences,
                          newsletter: checked
                        }
                      })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Email Digest Frequency</Label>
                  <Select
                    value={preferences.emailPreferences.digestFrequency}
                    onValueChange={(value: "daily" | "weekly" | "monthly") => setPreferences({
                      ...preferences,
                      emailPreferences: {
                        ...preferences.emailPreferences,
                        digestFrequency: value
                      }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Browser Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Enable Browser Notifications</Label>
                    <p className="text-sm text-gray-600">Receive real-time notifications in your browser</p>
                  </div>
                  <Switch
                    checked={preferences.notificationSettings.browserNotifications}
                    onCheckedChange={(checked) => setPreferences({
                      ...preferences,
                      notificationSettings: {
                        ...preferences.notificationSettings,
                        browserNotifications: checked
                      }
                    })}
                  />
                </div>

                {preferences.notificationSettings.browserNotifications && (
                  <div className="space-y-4">
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-medium">Quiet Hours</Label>
                        <p className="text-sm text-gray-600">Mute notifications during specific hours</p>
                      </div>
                      <Switch
                        checked={preferences.notificationSettings.quietHours}
                        onCheckedChange={(checked) => setPreferences({
                          ...preferences,
                          notificationSettings: {
                            ...preferences.notificationSettings,
                            quietHours: checked
                          }
                        })}
                      />
                    </div>

                    {preferences.notificationSettings.quietHours && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Start Time</Label>
                          <Input
                            type="time"
                            value={preferences.notificationSettings.quietHoursStart}
                            onChange={(e) => setPreferences({
                              ...preferences,
                              notificationSettings: {
                                ...preferences.notificationSettings,
                                quietHoursStart: e.target.value
                              }
                            })}
                          />
                        </div>
                        <div>
                          <Label>End Time</Label>
                          <Input
                            type="time"
                            value={preferences.notificationSettings.quietHoursEnd}
                            onChange={(e) => setPreferences({
                              ...preferences,
                              notificationSettings: {
                                ...preferences.notificationSettings,
                                quietHoursEnd: e.target.value
                              }
                            })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Submission Defaults Tab */}
          <TabsContent value="submission" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Submission Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Default Category</Label>
                    <Select
                      value={preferences.submissionDefaults.defaultCategory}
                      onValueChange={(value) => setPreferences({
                        ...preferences,
                        submissionDefaults: {
                          ...preferences.submissionDefaults,
                          defaultCategory: value
                        }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="original_research">Original Research</SelectItem>
                        <SelectItem value="review_article">Review Article</SelectItem>
                        <SelectItem value="case_study">Case Study</SelectItem>
                        <SelectItem value="short_communication">Short Communication</SelectItem>
                        <SelectItem value="letter_to_editor">Letter to Editor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Default Language</Label>
                    <Select
                      value={preferences.submissionDefaults.defaultLanguage}
                      onValueChange={(value) => setPreferences({
                        ...preferences,
                        submissionDefaults: {
                          ...preferences.submissionDefaults,
                          defaultLanguage: value
                        }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Default Keywords</Label>
                  <Textarea
                    value={preferences.submissionDefaults.defaultKeywords.join(", ")}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      submissionDefaults: {
                        ...preferences.submissionDefaults,
                        defaultKeywords: e.target.value.split(",").map(k => k.trim()).filter(k => k)
                      }
                    })}
                    placeholder="Enter keywords separated by commas"
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Default Abstract Template</Label>
                  <Textarea
                    value={preferences.submissionDefaults.defaultAbstract}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      submissionDefaults: {
                        ...preferences.submissionDefaults,
                        defaultAbstract: e.target.value
                      }
                    })}
                    placeholder="Enter your default abstract template..."
                    rows={4}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Auto-save Drafts</Label>
                      <p className="text-sm text-gray-600">Automatically save your submission drafts</p>
                    </div>
                    <Switch
                      checked={preferences.submissionDefaults.autoSave}
                      onCheckedChange={(checked) => setPreferences({
                        ...preferences,
                        submissionDefaults: {
                          ...preferences.submissionDefaults,
                          autoSave: checked
                        }
                      })}
                    />
                  </div>

                  {preferences.submissionDefaults.autoSave && (
                    <div>
                      <Label>Auto-save Interval (seconds)</Label>
                      <Input
                        type="number"
                        min="30"
                        max="300"
                        value={preferences.submissionDefaults.autoSaveInterval}
                        onChange={(e) => setPreferences({
                          ...preferences,
                          submissionDefaults: {
                            ...preferences.submissionDefaults,
                            autoSaveInterval: parseInt(e.target.value)
                          }
                        })}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Profile Visibility
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Profile Visibility</Label>
                  <Select
                    value={preferences.privacySettings.profileVisibility}
                    onValueChange={(value: "public" | "private" | "authors_only") => setPreferences({
                      ...preferences,
                      privacySettings: {
                        ...preferences.privacySettings,
                        profileVisibility: value
                      }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public - Visible to everyone</SelectItem>
                      <SelectItem value="authors_only">Authors Only - Visible to other authors</SelectItem>
                      <SelectItem value="private">Private - Only visible to editors</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Show Email Address</Label>
                      <p className="text-sm text-gray-600">Allow others to see your email address</p>
                    </div>
                    <Switch
                      checked={preferences.privacySettings.showEmail}
                      onCheckedChange={(checked) => setPreferences({
                        ...preferences,
                        privacySettings: {
                          ...preferences.privacySettings,
                          showEmail: checked
                        }
                      })}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Show Phone Number</Label>
                      <p className="text-sm text-gray-600">Allow others to see your phone number</p>
                    </div>
                    <Switch
                      checked={preferences.privacySettings.showPhone}
                      onCheckedChange={(checked) => setPreferences({
                        ...preferences,
                        privacySettings: {
                          ...preferences.privacySettings,
                          showPhone: checked
                        }
                      })}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Show Institution</Label>
                      <p className="text-sm text-gray-600">Allow others to see your institution</p>
                    </div>
                    <Switch
                      checked={preferences.privacySettings.showInstitution}
                      onCheckedChange={(checked) => setPreferences({
                        ...preferences,
                        privacySettings: {
                          ...preferences.privacySettings,
                          showInstitution: checked
                        }
                      })}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Allow Contact</Label>
                      <p className="text-sm text-gray-600">Allow other users to contact you</p>
                    </div>
                    <Switch
                      checked={preferences.privacySettings.allowContact}
                      onCheckedChange={(checked) => setPreferences({
                        ...preferences,
                        privacySettings: {
                          ...preferences.privacySettings,
                          allowContact: checked
                        }
                      })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Language Tab */}
          <TabsContent value="language" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Language Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Interface Language</Label>
                    <Select
                      value={preferences.languageSettings.interfaceLanguage}
                      onValueChange={(value) => setPreferences({
                        ...preferences,
                        languageSettings: {
                          ...preferences.languageSettings,
                          interfaceLanguage: value
                        }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Submission Language</Label>
                    <Select
                      value={preferences.languageSettings.submissionLanguage}
                      onValueChange={(value) => setPreferences({
                        ...preferences,
                        languageSettings: {
                          ...preferences.languageSettings,
                          submissionLanguage: value
                        }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Preferred Review Language</Label>
                  <Select
                    value={preferences.languageSettings.preferredReviewLanguage}
                    onValueChange={(value) => setPreferences({
                      ...preferences,
                      languageSettings: {
                        ...preferences.languageSettings,
                        preferredReviewLanguage: value
                      }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Change Password
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPassword ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      placeholder="Enter your current password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="Enter your new password"
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    placeholder="Confirm your new password"
                  />
                </div>

                <Button onClick={handlePasswordChange} className="w-full">
                  Change Password
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </AuthorLayout>
    </RouteGuard>
  )
}
