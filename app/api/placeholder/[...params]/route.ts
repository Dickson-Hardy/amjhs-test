import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { params: string[] } }
) {
  const resolvedParams = await params
  const [width, height] = resolvedParams.params
  const w = parseInt(width) || 300
  const h = parseInt(height) || 200

  // Create a simple SVG placeholder
  const svg = `
    <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <rect width="100%" height="100%" fill="none" stroke="#e5e7eb" stroke-width="2"/>
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" 
            font-family="serif" font-size="14" fill="#6b7280">
        Journal Cover
      </text>
      <text x="50%" y="60%" text-anchor="middle" dominant-baseline="middle" 
            font-family="serif" font-size="12" fill="#9ca3af">
        ${w}×${h}
      </text>
    </svg>
  `

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000',
    },
  })
}
