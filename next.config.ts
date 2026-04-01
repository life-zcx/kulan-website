import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '3000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'adkulan.shop',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'adkulan.shop',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'adkulan.ru',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'adkulan.ru',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
