import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';
const useEmulator = process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR === 'true';

// 로컬 개발·E2E 에서만 필요한 출처: HMR 웹소켓, Firebase 에뮬레이터.
const devConnect = isProd && !useEmulator ? [] : ['http://localhost:*', 'http://127.0.0.1:*'];
const devWs = isProd ? [] : ['ws://localhost:*', 'ws://127.0.0.1:*'];

// Content-Security-Policy — XSS 가 나더라도 외부 스크립트를 불러오거나 토큰을 임의 서버로 보내지
// 못하게 출처를 묶는다. Next 의 인라인 부트스트랩 스크립트 때문에 script-src 에 'unsafe-inline' 이
// 남아 있다(nonce 방식은 모든 페이지를 동적 렌더링으로 바꿔야 한다). 새 외부 서비스를 붙이면
// 여기에 출처를 추가해야 한다. 명세: docs/01-tech-stack.md 「보안 헤더」
const csp = [
  "default-src 'self'",
  // googletagmanager: GA4(firebase/analytics), apis.google.com: Firebase Auth 팝업/리다이렉트 헬퍼
  [
    "script-src 'self' 'unsafe-inline'",
    ...(isProd ? [] : ["'unsafe-eval'"]),
    'https://www.googletagmanager.com',
    'https://apis.google.com',
    'https://www.gstatic.com',
  ].join(' '),
  "style-src 'self' 'unsafe-inline'",
  // 이미지는 스크립트 실행 경로가 아니라서 https 전체를 허용한다(프로필 사진, Storage, 링크 썸네일).
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "media-src 'self' blob: https://firebasestorage.googleapis.com",
  // googleapis: Auth·Firestore·Storage·FCM·Installations, cloudfunctions: callable Functions
  [
    "connect-src 'self'",
    'https://*.googleapis.com',
    'https://*.cloudfunctions.net',
    'https://*.google-analytics.com',
    'https://*.analytics.google.com',
    'https://www.googletagmanager.com',
    ...devConnect,
    ...devWs,
  ].join(' '),
  // Firebase Auth 가 세션 확인용으로 authDomain 의 /__/auth/iframe 을 띄운다(프리뷰는 firebaseapp.com).
  "frame-src 'self' https://*.firebaseapp.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  ...(isProd ? ['upgrade-insecure-requests'] : []),
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(), payment=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
];

const nextConfig: NextConfig = {
  // /__/* 는 firebaseapp.com 으로 프록시되는 Firebase Auth 핸들러라 자체 스크립트 출처가 따로 있다.
  // 우리 CSP 를 씌우면 로그인이 깨지므로 제외한다.
  async headers() {
    return [{ source: '/((?!__/).*)', headers: securityHeaders }];
  },
  transpilePackages: ['@uandi/ui'],
  // Firebase Auth 핸드오프를 1st-party 도메인으로 만들기 위한 투명 리버스 프록시.
  // authDomain 을 이 앱 도메인(uandi-web.vercel.app)으로 바꾸면, Firebase SDK 는
  // /__/auth/* 를 이 도메인에서 로드한다. iOS WKWebView 의 제3자 저장소 차단(ITP)을
  // 우회하기 위해 302 리다이렉트가 아닌 rewrite(프록시)로 firebaseapp.com 에 위임한다.
  // 자체 호스팅(handler 파일 복사)은 Apple 로그인에서 동작하지 않으므로 프록시를 사용한다.
  async rewrites() {
    return [
      {
        source: '/__/auth/:path*',
        destination: 'https://uandi-55ee4.firebaseapp.com/__/auth/:path*',
      },
      {
        source: '/__/firebase/:path*',
        destination: 'https://uandi-55ee4.firebaseapp.com/__/firebase/:path*',
      },
    ];
  },
};

export default nextConfig;
