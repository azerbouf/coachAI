/** @type {import('next').NextConfig} */
const nextConfig = {
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
