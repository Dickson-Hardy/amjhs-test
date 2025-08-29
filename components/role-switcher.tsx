"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { 
  UserCheck, 
  Users, 
  FileText, 
  AlertCircle,
  Info
} from "lucide-react"
import { toast } from "sonner"

interface RoleSwitcherProps {
  onRoleChange?: (newRole: string) => void
}

export default function RoleSwitcher({ onRoleChange }: RoleSwitcherProps) {
  const { data: session, update } = useSession()
  const [isSwitching, setIsSwitching] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  // Only show for editorial assistants
  if (session?.user?.role !== "editorial-assistant") {
    return null
  }

  const currentRole = session.user.role
  const targetRole = "associate-editor"

  const handleRoleSwitch = async () => {
    if (!showConfirmation) {
      setShowConfirmation(true)
      return
    }

    setIsSwitching(true)
    try {
      const response = await fetch("/api/user/switch-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetRole,
          reason: "Editorial workflow requirement"
        }),
      })

      if (response.ok) {
        const result = await response.json()
        
        // Update the session
        await update({
          ...session,
          user: {
            ...session.user,
            role: targetRole
          }
        })

        toast.success(`Role switched to ${targetRole}`)
        onRoleChange?.(targetRole)
        setShowConfirmation(false)
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to switch role")
      }
    } catch (error) {
      toast.error("An error occurred while switching roles")
    } finally {
      setIsSwitching(false)
    }
  }

  const handleCancel = () => {
    setShowConfirmation(false)
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <UserCheck className="h-5 w-5 text-blue-600" />
          Role Switcher
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Role Display */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            <span className="font-medium">Current Role:</span>
          </div>
          <Badge variant="default" className="bg-blue-600">
            {currentRole}
          </Badge>
        </div>

        {/* Role Switch Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch
              id="role-switch"
              checked={showConfirmation}
              onCheckedChange={setShowConfirmation}
              disabled={isSwitching}
            />
            <Label htmlFor="role-switch" className="font-medium">
              Switch to Associate Editor
            </Label>
          </div>
          <Badge variant="outline" className="text-green-700 border-green-700">
            {targetRole}
          </Badge>
        </div>

        {/* Confirmation Dialog */}
        {showConfirmation && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2 mb-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">Confirm Role Switch</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  You're about to switch from <strong>Editorial Assistant</strong> to <strong>Associate Editor</strong>.
                  This will change your dashboard and available actions.
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleRoleSwitch}
                disabled={isSwitching}
                className="bg-green-600 hover:bg-green-700"
                size="sm"
              >
                {isSwitching ? "Switching..." : "Confirm Switch"}
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
          <Info className="h-4 w-4 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Role Switching Benefits:</p>
            <ul className="space-y-1 text-xs">
              <li>• Access to associate editor dashboard</li>
              <li>• Manuscript assignment capabilities</li>
              <li>• Review management tools</li>
              <li>• Can switch back to editorial assistant anytime</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
