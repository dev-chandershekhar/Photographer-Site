import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const remotePatterns: NonNullable<NextConfig['images']>['remotePatterns'] = []
if (process.env.R2_PUBLIC_URL) {
  const r2 = new URL(process.env.R2_PUBLIC_URL)
  remotePatterns.push({
    protocol: r2.protocol.replace(':', '') as 'http' | 'https',
    hostname: r2.hostname,
    pathname: '/**',
  })
}

const nextConfig: NextConfig = {
  output: 'standalone',
  // Don't advertise the stack (and stops withPayload adding its own X-Powered-By).
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    // Media filenames are unique, so optimised copies can be cached for a week.
    minimumCacheTTL: 60 * 60 * 24 * 7,
    remotePatterns,
    // Local-disk fallback when R2 isn't configured (dev only).
    localPatterns: [{ pathname: '/api/media/file/**' }],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }
    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

/**
 * Baseline hardening for every route. HSTS is set at Cloudflare (SSL/TLS → Edge Certificates).
 * No CSP yet: Turnstile, Umami and next/image would each need allowances; add one with the launch QA.
 */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
]

const payloadConfig = withPayload(nextConfig, { devBundleServerPackages: false })

/**
 * withPayload sends `Accept-CH` / `Critical-CH: Sec-CH-Prefers-Color-Scheme` on every route
 * (the admin uses it for dark mode). On the public site `Critical-CH` makes Chrome re-request
 * the page on a visitor's first visit (~600ms) and `Vary` hurts CDN caching, so scope those
 * headers to /admin only.
 */
const config: NextConfig = {
  ...payloadConfig,
  headers: async () => {
    const rules = (await payloadConfig.headers?.()) ?? []
    const scoped = rules.map((rule) => (rule.source === '/:path*' ? { ...rule, source: '/admin/:path*' } : rule))
    return [...scoped, { source: '/:path*', headers: securityHeaders }]
  },
}

export default config
