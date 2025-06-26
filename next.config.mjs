/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co', // For Supabase storage images
      },
      {
        protocol: 'https',
        hostname: 'd3v0px0pttie1i.cloudfront.net', // Existing Cloudfront domain
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // For Google user profile images
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com', // For YouTube video thumbnails
      },
    ],
  },
};

export default nextConfig;