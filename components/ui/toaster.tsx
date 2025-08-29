"use client"

import * as React from "react"
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

type ActionObject = {
  label: string
  onClick: () => void
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, persistent, duration, icon, ...props }) {
        return (
          <Toast key={id} icon={icon} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action && (
              React.isValidElement(action) ? (
                action
              ) : (
                typeof action === 'object' && 
                action !== null && 
                'label' in action && 
                'onClick' in action ? (
                  <ToastAction 
                    altText={(action as ActionObject).label}
                    onClick={(action as ActionObject).onClick}
                  >
                    {(action as ActionObject).label}
                  </ToastAction>
                ) : null
              )
            )}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
