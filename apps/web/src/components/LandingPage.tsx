'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button, Logo } from '@uandi/ui';
import { signInWithGoogle } from '@/lib/firebase/auth';

const ERROR_MESSAGES: Record<string, string> = {
  'auth/popup-blocked': '팝업이 차단되었어요. 브라우저 설정에서 팝업을 허용해 주세요.',
  'auth/network-request-failed': '네트워크 오류가 발생했어요. 연결 상태를 확인해 주세요.',
};

export function LandingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // signInWithPopup은 팝업 닫힘을 감지 못해 Promise가 pending으로 남을 수 있음
  // window focus 시 로딩 상태를 리셋해 UX 보완
  useEffect(() => {
    if (!isLoading) return;
    const handleFocus = () => setIsLoading(false);
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isLoading]);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      // 성공 시: onAuthStateChanged → AuthInit이 상태 업데이트 → middleware가 라우팅 처리
    } catch (err) {
      const code = (err as { code?: string }).code ?? '';
      if (code === 'auth/popup-closed-by-user') {
        // 정상 취소 — 에러 표시 없음
      } else {
        setError(ERROR_MESSAGES[code] ?? '로그인 중 문제가 발생했어요. 다시 시도해 주세요.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <Logo variant="icon" className="h-16 w-16" />
      <p className="mt-6 text-center text-xl font-semibold leading-snug text-foreground">
        둘이서 만드는
        <br />
        우리만의 일상
      </p>
      <p className="mt-3 text-center text-sm text-muted-foreground">
        사진을 함께 모으고, 돈을 함께 관리하세요.
      </p>
      <div className="mt-10 w-full max-w-sm">
        <Button
          data-testid="google-login-btn"
          className="w-full"
          size="lg"
          onClick={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" size={16} />
              로그인 중...
            </>
          ) : (
            '구글로 시작하기'
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
      </div>
    </main>
  );
}
