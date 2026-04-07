import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: import.meta.dirname,

  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'minio',
        port: '9000',
        pathname: '/catalog-photos/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/catalog-photos/**',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // SEC-09: removed 'unsafe-eval' entirely; kept 'unsafe-inline'
              // for script-src because Next.js still injects small inline
              // bootstrap scripts in production and a nonce-based approach
              // would require middleware-driven CSP injection on every
              // request. Removing 'unsafe-eval' already mitigates the
              // largest XSS-amplification surface.
              "script-src 'self' 'unsafe-inline'",
              // Tailwind / Next inject inline <style> tags, so 'unsafe-inline'
              // is still required for style-src.
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: http://minio:9000 http://localhost:9000",
              "font-src 'self'",
              // Browser only talks to same-origin /api routes; the backend
              // proxy runs server-side, so no external connect targets.
              "connect-src 'self'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
            ].join('; '),
          },
        ],
      },
    ]
  },

  poweredByHeader: false,

  typescript: {
    ignoreBuildErrors: false,
  },
}

export default nextConfig
