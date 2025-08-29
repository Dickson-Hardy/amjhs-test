"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LucideIcon } from "lucide-react"
import { useRouter } from "next/navigation"

interface ActionButtonProps {
  icon: LucideIcon
  label: string
  href: string
  variant?: "default" | "outline" | "ghost"
  size?: "sm" | "default" | "lg"
  className?: string
  badge?: number
  disabled?: boolean
}

export function ActionButton({ 
  icon: Icon, 
  label, 
  href, 
  variant = "outline", 
  size = "sm",
  className = "",
  badge,
  disabled = false
}: ActionButtonProps) {
  const router = useRouter()

  return (
    <Button 
      size={size}
      variant={variant}
      className={className}
      onClick={() => router.push(href)}
      disabled={disabled}
    >
      <Icon className="h-4 w-4 mr-1" />
      {label}
      {badge && badge > 0 && (
        <Badge className="ml-1 bg-blue-500 text-white text-xs">
          {badge}
        </Badge>
      )}
    </Button>
  )
}