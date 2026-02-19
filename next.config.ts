import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Supabase storage (user-uploaded screenshots)
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // Placeholder images used in seed/demo data
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      // Common screenshot sources
      {
        protocol: 'https',
        hostname: 'pbs.twimg.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
      },
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
      },
    ],
  },
};

export default nextConfig;
