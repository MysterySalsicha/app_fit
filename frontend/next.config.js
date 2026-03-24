const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'hunterfit-cache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 86400, // 24h
        },
        networkTimeoutSeconds: 10,
      },
    },
  ],
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.cloudflare.com' },
      { protocol: 'https', hostname: 'pub-*.r2.dev' },
    ],
  },
  // API proxy para o backend .NET
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
      },
    ]
  },
}

module.exports = withPWA(nextConfig)
