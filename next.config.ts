import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.garmin.com',
      },
      {
        protocol: 'https',
        hostname: 'connect.garmin.com',
      },
      {
        protocol: 'https',
        hostname: 'static.garmin.com',
      },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['garmin-connect'],
  },
};

export default nextConfig;
