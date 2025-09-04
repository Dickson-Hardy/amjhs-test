"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"

interface Advertisement {
  id: string
  title: string
  imageUrl: string
  targetUrl?: string
  position: string
  isActive: boolean
  createdAt: string
  expiresAt: string
}

interface AdvertisementDisplayProps {
  position: "sidebar-top" | "sidebar-bottom"
  fallbackContent?: React.ReactNode
}

export default function AdvertisementDisplay({ 
  position, 
  fallbackContent 
}: AdvertisementDisplayProps) {
  const [advertisement, setAdvertisement] = useState<Advertisement | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAdvertisement() {
      try {
        const response = await fetch(`/api/admin/advertisements?position=${position}&active=true`)
        const data = await response.json()

        if (data.success && data.advertisements.length > 0) {
          // Get the first active advertisement for this position
          setAdvertisement(data.advertisements[0])
        }
      } catch (error) {
        console.error("Error fetching advertisement:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAdvertisement()
  }, [position])

  if (loading) {
    return (
      <div className="bg-gray-50 p-4 rounded border">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/2 mb-3"></div>
          <div className="bg-gray-300 rounded h-48"></div>
        </div>
      </div>
    )
  }

  if (!advertisement) {
    return fallbackContent ? (
      <>{fallbackContent}</>
    ) : (
      <div className="bg-gray-50 p-4 rounded border">
        <h3 className="font-semibold text-blue-900 text-sm mb-3">
          {position === "sidebar-top" ? "ADVERTISEMENT" : "SPONSOR"}
        </h3>
        <div className="bg-white border border-dashed border-gray-300 rounded p-4 text-center min-h-[200px] flex flex-col justify-center">
          <div className="text-gray-400 text-sm">
            <div className="mb-2">
              {position === "sidebar-top" ? "Advertisement Space" : "Sponsor Banner"}
            </div>
            <div className="text-xs">
              {position === "sidebar-top" ? "300x250 Banner" : "300x200 Banner"}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const adContent = (
    <div className="bg-gray-50 p-4 rounded border">
      <h3 className="font-semibold text-blue-900 text-sm mb-3">
        {position === "sidebar-top" ? "ADVERTISEMENT" : "SPONSOR"}
      </h3>
      <div className="bg-white rounded overflow-hidden">
        <Image
          src={advertisement.imageUrl}
          alt={advertisement.title}
          width={300}
          height={position === "sidebar-top" ? 250 : 200}
          className="w-full h-auto object-cover"
          onError={(e) => {
            // Fallback to placeholder if image fails to load
            e.currentTarget.src = "/api/placeholder/300/" + (position === "sidebar-top" ? "250" : "200")
          }}
        />
      </div>
    </div>
  )

  if (advertisement.targetUrl) {
    return (
      <Link 
        href={advertisement.targetUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="block hover:opacity-90 transition-opacity"
      >
        {adContent}
      </Link>
    )
  }

  return adContent
}
