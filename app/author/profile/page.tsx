"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { RouteGuard } from "@/components/route-guard"
import AuthorLayout from "@/components/layouts/author-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  User,
  Mail,
  Phone,
  Globe,
  Building,
  GraduationCap,
  Award,
  FileText,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  MapPin,
  Calendar,
  Shield,
  Eye,
  EyeOff
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface AuthorProfile {
  id: string
  name: string
  email: string
  role: string
  affiliation: string
  bio: string
  orcid: string
  orcidVerified: boolean
  specializations: string[]
  expertise: string[]
  researchInterests: string[]
  languagesSpoken: string[]
  profileCompleteness: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  // Optional arrays that might not be present
  academicCredentials?: AcademicCredential[]
  publications?: Publication[]
  emailPreferences?: EmailPreferences
}

interface AcademicCredential {
  id: string
  degree: string
  field: string
  institution: string
  year: string
}

interface Publication {
  id: string
  title: string
  journal: string
  year: string
  doi: string
  citations: number
}

interface EmailPreferences {
  submissionUpdates: boolean
  reviewRequests: boolean
  publicationAlerts: boolean
  newsletter: boolean
}

export default function AuthorProfilePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<AuthorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })

  useEffect(() => {
    if (session?.user?.id) {
      fetchProfile()
    }
  }, [session?.user?.id])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/user/profile`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setProfile(data.profile)
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      // Prepare the data in the format expected by the API
      const updateData = {
        name: profile?.name,
        affiliation: profile?.affiliation,
        bio: profile?.bio,
        orcid: profile?.orcid,
        expertise: profile?.expertise || [],
        specializations: profile?.specializations || [],
        researchInterests: profile?.researchInterests || [],
        languagesSpoken: profile?.languagesSpoken || []
      }

      const response = await fetch(`/api/user/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Update the profile with the returned data
          setProfile(prevProfile => ({
            ...prevProfile,
            ...data.profile
          }))
          toast({
            title: "Success",
            description: "Profile updated successfully"
          })
          setEditing(false)
        }
      } else {
        throw new Error("Failed to update profile")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      })
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

  const addCredential = () => {
    if (!profile) return
    const newCredential: AcademicCredential = {
      id: Date.now().toString(),
      degree: "",
      field: "",
      institution: "",
      year: ""
    }
    setProfile({
      ...profile,
      academicCredentials: [...(profile.academicCredentials || []), newCredential]
    })
  }

  const removeCredential = (id: string) => {
    if (!profile) return
    setProfile({
      ...profile,
      academicCredentials: (profile.academicCredentials || []).filter(c => c.id !== id)
    })
  }

  const updateCredential = (id: string, field: keyof AcademicCredential, value: string) => {
    if (!profile) return
    setProfile({
      ...profile,
      academicCredentials: (profile.academicCredentials || []).map(c =>
        c.id === id ? { ...c, [field]: value } : c
      )
    })
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

  if (!profile) {
    return (
      <RouteGuard allowedRoles={["author"]}>
        <AuthorLayout>
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2">Profile Not Found</h2>
            <p className="text-gray-600 mb-4">Unable to load your profile information.</p>
            <Button onClick={fetchProfile}>Try Again</Button>
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
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Author Profile</h1>
              <p className="text-slate-600">Manage your personal information and academic credentials</p>
            </div>
            <div className="flex items-center gap-3">
              {editing ? (
                <>
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={() => setEditing(false)}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={() => setEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Profile Completeness */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Profile Completeness</span>
              <span className="text-sm text-gray-600">{profile.profileCompleteness}%</span>
            </div>
            <Progress value={profile.profileCompleteness} className="h-2" />
            <p className="text-xs text-gray-500 mt-2">
              Complete your profile to improve your submission experience
            </p>
          </CardContent>
        </Card>

        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList>
            <TabsTrigger value="personal">Personal Information</TabsTrigger>
            <TabsTrigger value="academic">Academic Credentials</TabsTrigger>
            <TabsTrigger value="publications">Publications</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profile.name || ""}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      disabled={!editing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email || ""}
                      disabled={true} // Email should not be editable
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio">Biography</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio || ""}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    disabled={!editing}
                    placeholder="Brief description of your research interests and expertise..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="researchInterests">Research Interests</Label>
                  <Textarea
                    id="researchInterests"
                    value={(profile.researchInterests || []).join(", ")}
                    onChange={(e) => setProfile({ 
                      ...profile, 
                      researchInterests: e.target.value.split(",").map(s => s.trim()).filter(s => s.length > 0)
                    })}
                    disabled={!editing}
                    placeholder="Enter research interests separated by commas..."
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Institutional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="affiliation">Institution/Affiliation</Label>
                    <Input
                      id="affiliation"
                      value={profile.affiliation || ""}
                      onChange={(e) => setProfile({ ...profile, affiliation: e.target.value })}
                      disabled={!editing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="orcid">ORCID ID</Label>
                    <Input
                      id="orcid"
                      value={profile.orcid || ""}
                      onChange={(e) => setProfile({ ...profile, orcid: e.target.value })}
                      disabled={!editing}
                      placeholder="0000-0000-0000-0000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expertise">Areas of Expertise</Label>
                    <Textarea
                      id="expertise"
                      value={(profile.expertise || []).join(", ")}
                      onChange={(e) => setProfile({ 
                        ...profile, 
                        expertise: e.target.value.split(",").map(s => s.trim()).filter(s => s.length > 0)
                      })}
                      disabled={!editing}
                      placeholder="Enter areas of expertise separated by commas..."
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="specializations">Specializations</Label>
                    <Textarea
                      id="specializations"
                      value={(profile.specializations || []).join(", ")}
                      onChange={(e) => setProfile({ 
                        ...profile, 
                        specializations: e.target.value.split(",").map(s => s.trim()).filter(s => s.length > 0)
                      })}
                      disabled={!editing}
                      placeholder="Enter specializations separated by commas..."
                      rows={2}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Academic Credentials Tab */}
          <TabsContent value="academic" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Academic Credentials
                  </CardTitle>
                  {editing && (
                    <Button onClick={addCredential} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Credential
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!profile.academicCredentials || profile.academicCredentials.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <GraduationCap className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No academic credentials added yet</p>
                    {editing && (
                      <Button onClick={addCredential} className="mt-2">
                        Add Your First Credential
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {profile.academicCredentials.map((credential, index) => (
                      <div key={credential.id} className="border rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Degree</Label>
                            <Input
                              value={credential.degree}
                              onChange={(e) => updateCredential(credential.id, "degree", e.target.value)}
                              disabled={!editing}
                              placeholder="e.g., Ph.D., M.D., M.Sc."
                            />
                          </div>
                          <div>
                            <Label>Field of Study</Label>
                            <Input
                              value={credential.field}
                              onChange={(e) => updateCredential(credential.id, "field", e.target.value)}
                              disabled={!editing}
                              placeholder="e.g., Medicine, Biology, Chemistry"
                            />
                          </div>
                          <div>
                            <Label>Institution</Label>
                            <Input
                              value={credential.institution}
                              onChange={(e) => updateCredential(credential.id, "institution", e.target.value)}
                              disabled={!editing}
                              placeholder="University name"
                            />
                          </div>
                          <div>
                            <Label>Year</Label>
                            <Input
                              value={credential.year}
                              onChange={(e) => updateCredential(credential.id, "year", e.target.value)}
                              disabled={!editing}
                              placeholder="YYYY"
                            />
                          </div>
                        </div>
                        {editing && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeCredential(credential.id)}
                            className="mt-3"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Publications Tab */}
          <TabsContent value="publications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Publications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!profile.publications || profile.publications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No publications added yet</p>
                    <p className="text-sm">Publications will be automatically added from your submissions</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {profile.publications.map((publication) => (
                      <div key={publication.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-slate-900 mb-2">{publication.title}</h4>
                            <div className="flex items-center gap-4 text-sm text-slate-600">
                              <span>{publication.journal}</span>
                              <span>{publication.year}</span>
                              <span>{publication.citations} citations</span>
                            </div>
                            {publication.doi && (
                              <a
                                href={`https://doi.org/${publication.doi}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm"
                              >
                                DOI: {publication.doi}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Email Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Submission Updates</Label>
                      <p className="text-sm text-gray-600">Receive notifications about your manuscript status</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={profile.emailPreferences?.submissionUpdates || false}
                      onChange={(e) => setProfile({
                        ...profile,
                        emailPreferences: {
                          ...(profile.emailPreferences || {}),
                          submissionUpdates: e.target.checked
                        }
                      })}
                      disabled={!editing}
                      className="h-4 w-4"
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Review Requests</Label>
                      <p className="text-sm text-gray-600">Get notified when you're invited to review manuscripts</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={profile.emailPreferences?.reviewRequests || false}
                      onChange={(e) => setProfile({
                        ...profile,
                        emailPreferences: {
                          ...(profile.emailPreferences || {}),
                          reviewRequests: e.target.checked
                        }
                      })}
                      disabled={!editing}
                      className="h-4 w-4"
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Publication Alerts</Label>
                      <p className="text-sm text-gray-600">Stay updated on new publications in your field</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={profile.emailPreferences?.publicationAlerts || false}
                      onChange={(e) => setProfile({
                        ...profile,
                        emailPreferences: {
                          ...(profile.emailPreferences || {}),
                          publicationAlerts: e.target.checked
                        }
                      })}
                      disabled={!editing}
                      className="h-4 w-4"
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Newsletter</Label>
                      <p className="text-sm text-gray-600">Receive our monthly journal newsletter</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={profile.emailPreferences?.newsletter || false}
                      onChange={(e) => setProfile({
                        ...profile,
                        emailPreferences: {
                          ...(profile.emailPreferences || {}),
                          newsletter: e.target.checked
                        }
                      })}
                      disabled={!editing}
                      className="h-4 w-4"
                    />
                  </div>
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