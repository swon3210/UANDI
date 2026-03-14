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
        protocol: 'https',
        hostname: '*.firebasestorage.app',
      },
      {
        protocol: 'http',
        hostname: 'localhost', // Firebase Storage 에뮬레이터
      },
      {
        protocol: 'https',
        hostname: 'storage.example.com', // E2E 테스트 시드 데이터용
      },
    ],
  },
};

export default nextConfig;
