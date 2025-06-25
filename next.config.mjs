// scooter7/workforce-dev-hub/workforce-dev-hub-664dcb65bf6188fb247406ce2e6c515de2d28cc4/next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co', // Allow images from Supabase storage (e.g., user avatars)
      },
      {
        protocol: 'https',
        hostname: 'd3v0px0pttie1i.cloudfront.net',
      },
      // If you plan to use external images for topic icons or anything else, add their hostnames here.
      // Example:
      // {
      //   protocol: 'https',
      //   hostname: 'cdn.example.com',
      // },
    ],
  },
  // If you plan to heavily use Next.js Server Actions, you might enable this.
  // For now, we'll primarily use Route Handlers for API endpoints.
  // experimental: {
  //   serverActions: true,
  // },

  // You generally don't need to configure anything specific for Vercel deployment here,
  // as Vercel auto-detects Next.js projects and optimizes them.
};

export default nextConfig;