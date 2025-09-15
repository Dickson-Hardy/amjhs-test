/**
 * Button utility functions to ensure consistent button behavior across the app
 */

import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export interface ButtonAction {
  type: 'navigate' | 'submit' | 'action' | 'external'
  target?: string
  handler?: () => void | Promise<void>
  confirmMessage?: string
}

export const useButtonHandler = () => {
  const router = useRouter()
  const { toast } = useToast()

  const handleButtonAction = async (action: ButtonAction, disabled = false) => {
    if (disabled) return

    try {
      // Show confirmation if required
      if (action.confirmMessage) {
        const confirmed = window.confirm(action.confirmMessage)
        if (!confirmed) return
      }

      switch (action.type) {
        case 'navigate':
          if (action.target) {
            router.push(action.target)
          }
          break
        
        case 'external':
          if (action.target) {
            window.open(action.target, '_blank', 'noopener,noreferrer')
          }
          break
        
        case 'submit':
        case 'action':
          if (action.handler) {
            await action.handler()
          }
          break
      }
    } catch (error) {
      console.error('Button action failed:', error)
      toast({
        variant: "destructive",
        title: "Action Failed",
        description: "An error occurred. Please try again."
      })
    }
  }

  return { handleButtonAction }
}

export const validateButtonProps = (props: any) => {
  const warnings: string[] = []
  
  if (props.onClick && !props.type && !props.asChild) {
    warnings.push('Button has onClick but no type specified. Consider adding type="button"')
  }
  
  if (props.disabled && !props['aria-disabled']) {
    warnings.push('Disabled button should have aria-disabled attribute')
  }
  
  if (props.loading && !props['aria-busy']) {
    warnings.push('Loading button should have aria-busy="true"')
  }
  
  return warnings
}