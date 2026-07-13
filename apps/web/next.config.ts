import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
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
