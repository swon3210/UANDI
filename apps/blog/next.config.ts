import path from 'path';
import type { NextConfig } from 'next';

// 글쓰기 에디터(/write, /api/write/*)는 로컬 개발 서버 전용이다.
// 파일을 page.dev.tsx / route.dev.ts로 두고 이 확장자를 개발 모드에서만 인식시켜,
// 프로덕션 빌드에는 라우트도 번들도 아예 생기지 않게 한다.
const devPageExtensions = process.env.NODE_ENV === 'production' ? [] : ['dev.tsx', 'dev.ts'];

const nextConfig: NextConfig = {
  // 빌드 시 루트 content/posts/ 폴더를 파일 추적 범위에 포함
  outputFileTracingRoot: path.join(__dirname, '../../'),
  pageExtensions: ['tsx', 'ts', ...devPageExtensions],
};

export default nextConfig;
