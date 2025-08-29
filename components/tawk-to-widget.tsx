'use client'

import { useEffect } from 'react'

interface TawkToWidgetProps {
  propertyId?: string
  widgetId?: string
}

// Extend Window interface to include Tawk.to properties
declare global {
  interface Window {
    Tawk_API?: {
      onLoad?: () => void
      onChatMaximized?: () => void
      onChatMinimized?: () => void
      onChatStarted?: () => void
      onChatEnded?: () => void
      maximize?: () => void
      minimize?: () => void
      toggle?: () => void
      showWidget?: () => void
      hideWidget?: () => void
      setAttributes?: (attributes: Record<string, string>) => void
    }
    Tawk_LoadStart?: Date
  }
}

export default function TawkToWidget({ 
  propertyId = process.env.NEXT_PUBLIC_TAWK_TO_PROPERTY_ID || "YOUR_PROPERTY_ID", 
  widgetId = process.env.NEXT_PUBLIC_TAWK_TO_WIDGET_ID || "YOUR_WIDGET_ID" 
}: TawkToWidgetProps) {
  useEffect(() => {
    // Check if Tawk.to is enabled and we have valid IDs
    const isEnabled = process.env.NEXT_PUBLIC_TAWK_TO_ENABLED !== 'false'
    const hasValidIds = propertyId !== "YOUR_PROPERTY_ID" && widgetId !== "YOUR_WIDGET_ID"
    
    if (!isEnabled || !hasValidIds) {
      logger.info('Tawk.to is disabled or missing configuration')
      return
    }
    // Check if Tawk_API already exists to avoid loading multiple times
    if (typeof window !== 'undefined' && !window.Tawk_API) {
      // Initialize Tawk_API
      window.Tawk_API = window.Tawk_API || {}
      window.Tawk_LoadStart = new Date()

      // Create script element
      const script = document.createElement('script')
      script.async = true
      script.src = `https://embed.tawk.to/${propertyId}/${widgetId}`
      script.charset = 'UTF-8'
      script.setAttribute('crossorigin', '*')

      // Insert script into page
      const firstScript = document.getElementsByTagName('script')[0]
      if (firstScript && firstScript.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript)
      }

      // Optional: Configure Tawk.to settings
      window.Tawk_API.onLoad = function() {
        logger.api('Tawk.to chat widget loaded successfully')
        
        // Optional: Set visitor information if user is logged in
        // You can pass user data here if available
        // Tawk_API.setAttributes({
        //   'name': 'User Name',
        //   'email': 'user@example.com',
        //   'hash': 'hash_value'
        // })
      }

      // Optional: Handle chat events
      window.Tawk_API.onChatMaximized = function() {
        logger.api('Chat maximized')
      }

      window.Tawk_API.onChatMinimized = function() {
        logger.api('Chat minimized')
      }

      window.Tawk_API.onChatStarted = function() {
        logger.api('Chat started')
      }

      window.Tawk_API.onChatEnded = function() {
        logger.api('Chat ended')
      }
    }

    // Cleanup function
    return () => {
      // Optional: Remove script on component unmount
      // Note: Tawk.to doesn't recommend removing the script as it might break functionality
    }
  }, [propertyId, widgetId])

  return null // This component doesn't render anything visible
}

// Helper function to show/hide the chat widget
export const tawkToHelpers = {
  maximize: () => {
    if (typeof window !== 'undefined' && window.Tawk_API) {
      window.Tawk_API.maximize?.()
    }
  },
  minimize: () => {
    if (typeof window !== 'undefined' && window.Tawk_API) {
      window.Tawk_API.minimize?.()
    }
  },
  toggle: () => {
    if (typeof window !== 'undefined' && window.Tawk_API) {
      window.Tawk_API.toggle?.()
    }
  },
  showWidget: () => {
    if (typeof window !== 'undefined' && window.Tawk_API) {
      window.Tawk_API.showWidget?.()
    }
  },
  hideWidget: () => {
    if (typeof window !== 'undefined' && window.Tawk_API) {
      window.Tawk_API.hideWidget?.()
    }
  },
  setAttributes: (attributes: Record<string, string>) => {
    if (typeof window !== 'undefined' && window.Tawk_API) {
      window.Tawk_API.setAttributes?.(attributes)
    }
  }
}
