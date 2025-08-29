/** @type {import('next').NextConfig} */
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const nextConfig = {
  experimental: {
    // Removed deprecated options:
    // - serverComponentsExternalPackages moved to serverExternalPackages
    // - instrumentationHook removed as instrumentation.js is available by default
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['ik.imagekit.io'],
    formats: ['image/webp', 'image/avif'],
    unoptimized: true,
  },
  // Updated to use the new config option
  serverExternalPackages: ['winston', 'sharp', '@sentry/nextjs'],
  // Use the webpack instance provided by Next.js via the second arg;
  // avoids needing a direct 'webpack' dependency.
  webpack: (config, { isServer, dev, webpack }) => {
    // Keep alias for '@/'
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve?.alias,
        '@': path.resolve(__dirname),
      },
    }

    // Polyfill global self on the server to satisfy browser-oriented libs during SSR
    if (isServer) {
      config.plugins.push(
        new webpack.DefinePlugin({
          self: 'globalThis',
        })
      )
    }

    if (dev) {
      config.devtool = 'source-map'
    }

    return config
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
