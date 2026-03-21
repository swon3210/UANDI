import path from 'path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 빌드 시 루트 content/posts/ 폴더를 파일 추적 범위에 포함
  outputFileTracingRoot: path.join(__dirname, '../../'),
};

export default nextConfig;
