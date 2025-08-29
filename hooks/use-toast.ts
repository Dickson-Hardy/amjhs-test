"use client"

// Enhanced toast system for modern notifications
import * as React from "react"
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Info, 
  Loader2,
  Bell,
  AlertCircle
} from "lucide-react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 3
const TOAST_REMOVE_DELAY = 5000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement | { label: string; onClick: () => void }
  variant?: "default" | "destructive" | "success" | "warning" | "info" | "loading"
  icon?: React.ReactNode
  duration?: number
  persistent?: boolean
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, "id">

// Helper function to get icon based on variant
const getToastIcon = (variant?: string): React.ReactNode => {
  switch (variant) {
    case "success":
      return React.createElement(CheckCircle, { className: "h-5 w-5 text-green-600" })
    case "destructive":
      return React.createElement(XCircle, { className: "h-5 w-5 text-red-600" })
    case "warning":
      return React.createElement(AlertTriangle, { className: "h-5 w-5 text-amber-600" })
    case "info":
      return React.createElement(Info, { className: "h-5 w-5 text-blue-600" })
    case "loading":
      return React.createElement(Loader2, { className: "h-5 w-5 text-gray-600 animate-spin" })
    default:
      return React.createElement(Bell, { className: "h-5 w-5 text-gray-600" })
  }
}

function toast({ duration, persistent, variant, icon, ...props }: Toast) {
  const id = genId()
  const finalDuration = persistent ? 0 : (duration || TOAST_REMOVE_DELAY)
  const finalIcon = icon || getToastIcon(variant)

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      variant,
      icon: finalIcon,
      duration: finalDuration,
      persistent,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  // Auto-dismiss non-persistent toasts
  if (!persistent && finalDuration > 0) {
    setTimeout(() => {
      dismiss()
    }, finalDuration)
  }

  return {
    id: id,
    dismiss,
    update,
  }
}

// Convenience methods for different toast types
toast.success = (message: string, options?: Partial<Toast>) => {
  return toast({
    title: "Success",
    description: message,
    variant: "success",
    ...options,
  })
}

toast.error = (message: string, options?: Partial<Toast>) => {
  return toast({
    title: "Error",
    description: message,
    variant: "destructive",
    persistent: true,
    ...options,
  })
}

toast.warning = (message: string, options?: Partial<Toast>) => {
  return toast({
    title: "Warning",
    description: message,
    variant: "warning",
    ...options,
  })
}

toast.info = (message: string, options?: Partial<Toast>) => {
  return toast({
    title: "Information",
    description: message,
    variant: "info",
    ...options,
  })
}

toast.loading = (message: string, options?: Partial<Toast>) => {
  return toast({
    title: "Loading",
    description: message,
    variant: "loading",
    persistent: true,
    ...options,
  })
}

toast.promise = async <T,>(
  promise: Promise<T>,
  messages: {
    loading: string
    success: string
    error: string
  },
  options?: Partial<Toast>
) => {
  const loadingToast = toast.loading(messages.loading, options)
  
  try {
    const result = await promise
    loadingToast.dismiss()
    toast.success(messages.success, options)
    return result
  } catch (error) {
    loadingToast.dismiss()
    toast.error(messages.error, options)
    throw error
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }
