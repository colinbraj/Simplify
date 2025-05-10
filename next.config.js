/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.unsplash.com'],
    unoptimized: process.env.NODE_ENV === 'production', // This helps with Netlify deployment
  },
  // Add output configuration for better Netlify compatibility
  output: 'standalone',
  // Disable source maps in production for better performance
  productionBrowserSourceMaps: false,
  // Enable React strict mode for better development
  reactStrictMode: true,
}

module.exports = nextConfig
