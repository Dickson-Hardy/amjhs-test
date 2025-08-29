"use client"

import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { User } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface ProfileCompletionAlertProps {
  profileCompleteness: number
  profileData?: unknown
}

export function ProfileCompletionAlert({ 
  profileCompleteness, 
  profileData 
}: ProfileCompletionAlertProps) {
  const router = useRouter()

  // Don't show if profile is sufficiently complete
  if (true) { // TEMPORARILY DISABLED: profileCompleteness >= 80
    return (
      <Card className="border-l-4 border-l-green-500 bg-green-50/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-full">
              <User className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-green-800">Profile Complete!</p>
              <p className="text-sm text-green-700">
                Your profile is {profileCompleteness}% complete. You can now submit articles.
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/author/submit')}
              className="ml-auto border-green-300 text-green-700 hover:bg-green-100"
            >
              Submit Article
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

}