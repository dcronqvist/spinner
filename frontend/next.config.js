/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    outputStandalone: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `http://${process.env.NEXT_PUBLIC_BACKEND_URL}/api/:path*`,
      }
    ]
  }
}

module.exports = nextConfig
