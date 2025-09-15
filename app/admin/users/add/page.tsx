"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { RouteGuard } from "@/components/route-guard"
import AdminLayout from "@/components/layouts/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import {
  UserPlus,
  ArrowLeft,
  Save,
  Mail,
  User,
  Shield,
  Building,
  GraduationCap,
  Briefcase
} from "lucide-react"

interface UserFormData {
  email: string
  name: string
  role: string
  institution: string
  department: string
  specialization: string
  bio: string
  isActive: boolean
  emailVerified: boolean
  sendWelcomeEmail: boolean
}

export default function AddUserPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    name: '',
    role: '',
    institution: '',
    department: '',
    specialization: '',
    bio: '',
    isActive: true,
    emailVerified: false,
    sendWelcomeEmail: true
  })

  const handleInputChange = (field: keyof UserFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate required fields
      if (!formData.email || !formData.name || !formData.role) {
        toast.error("Please fill in all required fields")
        return
      }

      // Mock API call - replace with actual implementation
      console.log('Creating user:', formData)

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      toast.success("User created successfully!")

      // Reset form or redirect
      if (formData.sendWelcomeEmail) {
        toast.success("Welcome email sent to user")
      }

      router.push('/admin/users')

    } catch (error) {
      toast.error("Failed to create user")
      console.error('Error creating user:', error)
    } finally {
      setLoading(false)
    }
  }

  const roleOptions = [
    { value: 'author', label: 'Author', description: 'Can submit and manage manuscripts' },
    { value: 'reviewer', label: 'Reviewer', description: 'Can review assigned manuscripts' },
    { value: 'associate-editor', label: 'Associate Editor', description: 'Can manage sections and assign reviewers' },
    { value: 'editor', label: 'Editor', description: 'Can oversee editorial processes' },
    { value: 'editor-in-chief', label: 'Editor-in-Chief', description: 'Full editorial control' },
    { value: 'admin', label: 'Administrator', description: 'Full system access' }
  ]

  return (
    <RouteGuard allowedRoles={["admin", "editor-in-chief"]}>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Add New User</h1>
              <p className="text-gray-600">Create a new user account in the system</p>
            </div>
            <Button variant="outline" onClick={() => router.push('/admin/users')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2 text-blue-600" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="flex items-center">
                      Email Address *
                      <Mail className="h-4 w-4 ml-1 text-gray-400" />
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@example.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="name" className="flex items-center">
                      Full Name *
                      <User className="h-4 w-4 ml-1 text-gray-400" />
                    </Label>
                    <Input
                      id="name"
                      placeholder="Dr. John Smith"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="role" className="flex items-center">
                      Role *
                      <Shield className="h-4 w-4 ml-1 text-gray-400" />
                    </Label>
                    <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div>
                              <div className="font-medium">{option.label}</div>
                              <div className="text-sm text-gray-500">{option.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Professional Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Briefcase className="h-5 w-5 mr-2 text-green-600" />
                    Professional Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="institution" className="flex items-center">
                      Institution
                      <Building className="h-4 w-4 ml-1 text-gray-400" />
                    </Label>
                    <Input
                      id="institution"
                      placeholder="University of Example"
                      value={formData.institution}
                      onChange={(e) => handleInputChange('institution', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="department" className="flex items-center">
                      Department
                      <Building className="h-4 w-4 ml-1 text-gray-400" />
                    </Label>
                    <Input
                      id="department"
                      placeholder="Computer Science"
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="specialization" className="flex items-center">
                      Specialization/Area of Expertise
                      <GraduationCap className="h-4 w-4 ml-1 text-gray-400" />
                    </Label>
                    <Input
                      id="specialization"
                      placeholder="Machine Learning, IoT, Healthcare"
                      value={formData.specialization}
                      onChange={(e) => handleInputChange('specialization', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="bio">Biography</Label>
                  <Textarea
                    id="bio"
                    placeholder="Brief professional biography..."
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                    />
                    <Label htmlFor="isActive">Account Active</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="emailVerified"
                      checked={formData.emailVerified}
                      onCheckedChange={(checked) => handleInputChange('emailVerified', checked)}
                    />
                    <Label htmlFor="emailVerified">Email Verified</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="sendWelcomeEmail"
                      checked={formData.sendWelcomeEmail}
                      onCheckedChange={(checked) => handleInputChange('sendWelcomeEmail', checked)}
                    />
                    <Label htmlFor="sendWelcomeEmail">Send Welcome Email</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/users')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Creating User...' : 'Create User'}
              </Button>
            </div>
          </form>
        </div>
      </AdminLayout>
    </RouteGuard>
  )
}