'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Button, Logo } from '@uandi/ui';
import { signInWithApple, signInWithGoogle } from '@/lib/firebase/auth';

const ERROR_MESSAGES: Record<string, string> = {
  'auth/popup-blocked': '팝업이 차단되었어요. 브라우저 설정에서 팝업을 허용해 주세요.',
  'auth/network-request-failed': '네트워크 오류가 발생했어요. 연결 상태를 확인해 주세요.',
};

type Provider = 'google' | 'apple';

// Apple 로고 (Human Interface Guidelines — 버튼 안에서 currentColor로 렌더)
function AppleIcon() {
  return (
    <svg viewBox="0 0 384 512" fill="currentColor" aria-hidden="true">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}

export function LandingPage() {
  const [loadingProvider, setLoadingProvider] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  // signInWithPopup은 팝업 닫힘을 감지 못해 Promise가 pending으로 남을 수 있음
  // window focus 시 로딩 상태를 리셋해 UX 보완
  useEffect(() => {
    if (!loadingProvider) return;
    const handleFocus = () => setLoadingProvider(null);
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadingProvider]);

  const handleLogin = async (provider: Provider) => {
    setLoadingProvider(provider);
    setError(null);
    try {
      await (provider === 'google' ? signInWithGoogle() : signInWithApple());
      // 성공 시: onAuthStateChanged → AuthInit이 상태 업데이트 → middleware가 라우팅 처리
    } catch (err) {
      const code = (err as { code?: string }).code ?? '';
      if (code === 'auth/popup-closed-by-user') {
        // 정상 취소 — 에러 표시 없음
      } else {
        setError(ERROR_MESSAGES[code] ?? '로그인 중 문제가 발생했어요. 다시 시도해 주세요.');
      }
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center px-4">
      <div className="flex flex-1 flex-col items-center justify-center">
        <Logo variant="icon" className="h-16 w-16" />
        <p className="mt-6 text-center text-xl font-semibold leading-snug text-foreground">
          둘이서 만드는
          <br />
          우리만의 일상
        </p>
        <p className="mt-3 text-center text-sm leading-relaxed text-muted-foreground">
          함께 모으는 <span className="font-semibold text-foreground">우리집</span>,
          <br />
          각자 운영하는 <span className="font-semibold text-foreground">재테크</span>까지.
        </p>
        <div className="mt-10 w-full max-w-sm">
          <Button
            data-testid="google-login-btn"
            className="w-full"
            size="lg"
            onClick={() => handleLogin('google')}
            disabled={loadingProvider !== null}
          >
            {loadingProvider === 'google' ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                로그인 중...
              </>
            ) : (
              '구글로 시작하기'
            )}
          </Button>
          <Button
            data-testid="apple-login-btn"
            className="mt-3 w-full bg-black text-white hover:bg-black/90"
            size="lg"
            onClick={() => handleLogin('apple')}
            disabled={loadingProvider !== null}
          >
            {loadingProvider === 'apple' ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                로그인 중...
              </>
            ) : (
              <>
                <AppleIcon />
                Apple로 계속하기
              </>
            )}
          </Button>
          {error && (
            <p
              role="alert"
              data-testid="login-error"
              className="mt-2 text-center text-sm text-destructive"
            >
              {error}
            </p>
          )}
          <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
            로그인 시{' '}
            <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
              개인정보처리방침
            </Link>
            에 동의하는 것으로 간주됩니다.
          </p>
        </div>
      </div>
      <footer className="w-full pb-6 pt-4 text-center">
        <Link
          href="/privacy"
          className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
          data-testid="footer-privacy-link"
        >
          개인정보처리방침
        </Link>
      </footer>
    </main>
  );
}
