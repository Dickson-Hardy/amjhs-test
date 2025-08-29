"use client"

import React, { createContext, useContext, useState, useCallback } from "react"
import { X, CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

export type ToastType = "success" | "error" | "warning" | "info"

export interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, "id">) => void
  removeToast: (id: string) => void
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  warning: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new AppError("useToast must be used within a ToastProvider")
  }
  return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const generateId = () => Math.random().toString(36).substr(2, 9)

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = generateId()
    const newToast = { ...toast, id }
    setToasts((prev) => [...prev, newToast])

    // Auto remove after duration
    const duration = toast.duration || 5000
    setTimeout(() => {
      removeToast(id)
    }, duration)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const success = useCallback(
    (title: string, description?: string) => {
      addToast({ type: "success", title, description })
    },
    [addToast]
  )

  const error = useCallback(
    (title: string, description?: string) => {
      addToast({ type: "error", title, description, duration: 7000 })
    },
    [addToast]
  )

  const warning = useCallback(
    (title: string, description?: string) => {
      addToast({ type: "warning", title, description })
    },
    [addToast]
  )

  const info = useCallback(
    (title: string, description?: string) => {
      addToast({ type: "info", title, description })
    },
    [addToast]
  )

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        success,
        error,
        warning,
        info,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ 
  toasts, 
  removeToast 
}: { 
  toasts: Toast[]
  removeToast: (id: string) => void 
}) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  )
}

function ToastItem({ 
  toast, 
  onRemove 
}: { 
  toast: Toast
  onRemove: (id: string) => void 
}) {
  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case "success":
        return {
          className: "bg-green-50 border-green-200 text-green-800",
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
        }
      case "error":
        return {
          className: "bg-red-50 border-red-200 text-red-800",
          icon: <XCircle className="h-5 w-5 text-red-500" />,
        }
      case "warning":
        return {
          className: "bg-orange-50 border-orange-200 text-orange-800",
          icon: <AlertTriangle className="h-5 w-5 text-orange-500" />,
        }
      case "info":
        return {
          className: "bg-blue-50 border-blue-200 text-blue-800",
          icon: <Info className="h-5 w-5 text-blue-500" />,
        }
      default:
        return {
          className: "bg-gray-50 border-gray-200 text-gray-800",
          icon: <Info className="h-5 w-5 text-gray-500" />,
        }
    }
  }

  const { className, icon } = getToastStyles(toast.type)

  return (
    <div
      className={cn(
        "relative flex items-start space-x-3 p-4 border rounded-lg shadow-lg animate-in slide-in-from-right-full duration-300",
        className
      )}
    >
      <div className="flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{toast.title}</p>
        {toast.description && (
          <p className="text-sm opacity-90 mt-1">{toast.description}</p>
        )}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 p-1 rounded-md hover:bg-black/10 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
