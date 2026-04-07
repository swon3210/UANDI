import { useState } from 'react';
import { Button, Logo } from '@uandi/ui';
import { signInWithChrome } from '@/hooks/useAuth';

export function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithChrome();
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-6">
      <div className="text-center space-y-1">
        <Logo variant="full" className="h-8 mx-auto" />
        <p className="text-sm text-muted-foreground">커플 가계부</p>
      </div>

      <Button onClick={handleLogin} disabled={loading} className="w-full">
        {loading ? '로그인 중...' : 'Google로 로그인'}
      </Button>

      {error && <p className="text-sm text-destructive text-center">{error}</p>}
    </div>
  );
}
