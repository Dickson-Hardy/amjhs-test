"use client"

import React from 'react'
import { Loader2, RefreshCw, Zap, Heart, Brain } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingProps {
  variant?: 'default' | 'spinner' | 'pulse' | 'medical' | 'ai' | 'minimal'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  text?: string
  className?: string
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
}

const LoadingComponent: React.FC<LoadingProps> = ({
  variant = 'default',
  size = 'md',
  text,
  className,
  color = 'primary'
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  }

  const colorClasses = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    success: 'text-green-600',
    warning: 'text-amber-600',
    error: 'text-red-600'
  }

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  }

  const renderIcon = () => {
    const iconClass = cn(sizeClasses[size], colorClasses[color], "animate-spin")
    
    switch (variant) {
      case 'spinner':
        return <Loader2 className={iconClass} />
      case 'pulse':
        return (
          <div className={cn(
            "rounded-full bg-current animate-pulse",
            sizeClasses[size],
            colorClasses[color]
          )} />
        )
      case 'medical':
        return <Heart className={cn(iconClass, "animate-pulse")} />
      case 'ai':
        return <Brain className={iconClass} />
      case 'minimal':
        return (
          <div className="flex space-x-1">
            <div className={cn("rounded-full bg-current animate-bounce", 
              size === 'sm' ? 'h-1 w-1' : 'h-2 w-2', colorClasses[color])} 
              style={{ animationDelay: '0ms' }} />
            <div className={cn("rounded-full bg-current animate-bounce", 
              size === 'sm' ? 'h-1 w-1' : 'h-2 w-2', colorClasses[color])} 
              style={{ animationDelay: '150ms' }} />
            <div className={cn("rounded-full bg-current animate-bounce", 
              size === 'sm' ? 'h-1 w-1' : 'h-2 w-2', colorClasses[color])} 
              style={{ animationDelay: '300ms' }} />
          </div>
        )
      default:
        return <RefreshCw className={iconClass} />
    }
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      {renderIcon()}
      {text && (
        <p className={cn(
          "text-center font-medium animate-pulse",
          textSizeClasses[size],
          colorClasses[color]
        )}>
          {text}
        </p>
      )}
    </div>
  )
}

// Pre-built loading variants for common use cases
export const PageLoading: React.FC<{ text?: string }> = ({ text = "Loading..." }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
    <LoadingComponent variant="default" size="lg" text={text} color="primary" />
  </div>
)

export const SectionLoading: React.FC<{ text?: string; className?: string }> = ({ 
  text = "Loading...", 
  className 
}) => (
  <div className={cn("flex items-center justify-center py-12", className)}>
    <LoadingComponent variant="spinner" size="md" text={text} color="primary" />
  </div>
)

export const ButtonLoading: React.FC<{ text?: string }> = ({ text = "Loading..." }) => (
  <LoadingComponent variant="minimal" size="sm" text={text} color="primary" className="flex-row" />
)

export const MedicalLoading: React.FC<{ text?: string }> = ({ 
  text = "Processing medical data..." 
}) => (
  <div className="flex items-center justify-center py-8">
    <LoadingComponent variant="medical" size="lg" text={text} color="success" />
  </div>
)

export const AILoading: React.FC<{ text?: string }> = ({ 
  text = "AI analyzing manuscript..." 
}) => (
  <div className="flex items-center justify-center py-8">
    <LoadingComponent variant="ai" size="lg" text={text} color="primary" />
  </div>
)

// Skeleton loaders for content
export const ContentSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("animate-pulse space-y-4", className)}>
    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 rounded"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
    </div>
    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
  </div>
)

export const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("border border-gray-200 rounded-lg p-6 animate-pulse", className)}>
    <div className="flex items-center space-x-4 mb-4">
      <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
      <div className="space-y-2 flex-1">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
    <ContentSkeleton />
  </div>
)

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 5, 
  columns = 4 
}) => (
  <div className="animate-pulse">
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {/* Header */}
      {Array.from({ length: columns }).map((_, i) => (
        <div key={`header-${i}`} className="h-4 bg-gray-300 rounded"></div>
      ))}
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) =>
        Array.from({ length: columns }).map((_, colIndex) => (
          <div 
            key={`${rowIndex}-${colIndex}`} 
            className="h-4 bg-gray-200 rounded"
          ></div>
        ))
      )}
    </div>
  </div>
)

export default LoadingComponent
