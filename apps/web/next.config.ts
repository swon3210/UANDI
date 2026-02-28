import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@uandi/ui'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost', // Firebase Storage 에뮬레이터
      },
    ],
  },
};

export default nextConfig;
