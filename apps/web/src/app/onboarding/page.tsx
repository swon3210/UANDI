'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAtomValue, useSetAtom } from 'jotai';
import { Loader2, ChevronLeft, Copy, Check } from 'lucide-react';
import { useCopyToClipboard } from '@uidotdev/usehooks';
import { Button, InputOTP, InputOTPGroup, InputOTPSlot } from '@uandi/ui';
import { userAtom, authStatusAtom } from '@/stores/auth.store';
import { setAuthCookie } from '@/lib/auth-cookie';
import { createCouple, joinCoupleByInviteCode, subscribeToCouple } from '@/services/couple';
import { getUserDocument } from '@/services/user';

type Step = 'select' | 'create_pending' | 'join';

const JOIN_ERROR_MESSAGES: Record<string, string> = {
  INVITE_CODE_NOT_FOUND: '존재하지 않는 초대 코드예요',
  INVITE_CODE_EXPIRED: '초대 코드가 만료됐어요. 상대방에게 새 코드를 요청해 주세요',
  COUPLE_ALREADY_FULL: '이미 연결된 커플이에요',
  CANNOT_JOIN_OWN_COUPLE: '내가 만든 코드예요. 상대방에게 공유해 주세요',
};

export default function OnboardingPage() {
  const router = useRouter();
  const authStatus = useAtomValue(authStatusAtom);
  const user = useAtomValue(userAtom);
  const setUser = useSetAtom(userAtom);

  const [step, setStep] = useState<Step>('select');
  const [isLoading, setIsLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [coupleId, setCoupleId] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [joinError, setJoinError] = useState('');
  const [, copyToClipboard] = useCopyToClipboard();
  const [copied, setCopied] = useState(false);

  // 라우트 보호
  useEffect(() => {
    if (authStatus === 'unauthenticated') router.replace('/');
    if (authStatus === 'authenticated_with_couple') router.replace('/');
  }, [authStatus, router]);

  // 상대방이 합류하면 대시보드로 이동
  useEffect(() => {
    if (step !== 'create_pending' || !coupleId) return;

    const unsubscribe = subscribeToCouple(coupleId, async (couple) => {
      if (couple.memberUids.length === 2 && user) {
        const updated = await getUserDocument(user.uid);
        if (updated) setUser(updated);
        setAuthCookie('with_couple');
        router.replace('/');
      }
    });

    return () => unsubscribe();
  }, [step, coupleId, user, setUser, router]);

  if (
    authStatus === 'loading' ||
    authStatus === 'unauthenticated' ||
    authStatus === 'authenticated_with_couple'
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" size={32} />
      </div>
    );
  }

  // ── 단계 1: 선택 화면 ──────────────────────────────────────────
  if (step === 'select') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4">
        <h1 className="mb-2 text-2xl font-bold">UANDI</h1>
        <p className="mb-10 text-muted-foreground">우리 둘만의 공간</p>
        <div className="flex w-full max-w-sm flex-col gap-3">
          <Button
            className="w-full"
            onClick={async () => {
              if (!user) return;
              setIsLoading(true);
              try {
                const result = await createCouple(user.uid);
                setInviteCode(result.inviteCode);
                setCoupleId(result.coupleId);
                setStep('create_pending');
              } finally {
                setIsLoading(false);
              }
            }}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="animate-spin" size={16} /> : null}새 커플 공간 만들기
          </Button>
          <Button variant="outline" className="w-full" onClick={() => setStep('join')}>
            초대 코드 입력하기
          </Button>
        </div>
      </main>
    );
  }

  // ── 단계 2A: 초대 코드 표시 ────────────────────────────────────
  if (step === 'create_pending') {
    const handleCopy = async () => {
      await copyToClipboard(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <main className="flex min-h-screen flex-col px-4 pt-4">
        <button
          className="mb-8 flex items-center gap-1 text-sm text-muted-foreground"
          onClick={() => setStep('select')}
        >
          <ChevronLeft size={16} />
          뒤로
        </button>
        <div className="flex flex-1 flex-col items-center justify-center">
          <h2 className="mb-8 text-xl font-semibold">초대 코드</h2>
          <p
            data-testid="invite-code"
            className="mb-4 rounded-xl border border-border bg-secondary px-8 py-4 text-3xl font-bold tracking-[0.3em] text-foreground"
          >
            {inviteCode}
          </p>
          <Button variant="outline" size="sm" className="mb-6 gap-1" onClick={handleCopy}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? '복사됨' : '복사하기'}
          </Button>
          <p className="mb-1 text-center text-sm text-muted-foreground">
            상대방에게 이 코드를 공유해 주세요.
          </p>
          <p className="text-center text-xs text-muted-foreground">코드는 48시간 후 만료됩니다</p>
          <div className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="animate-spin" size={14} />
            상대방이 입력하면 자동으로 연결됩니다
          </div>
        </div>
      </main>
    );
  }

  // ── 단계 2B: 초대 코드 입력 ────────────────────────────────────
  const handleJoin = async () => {
    if (!user || otpValue.length < 6) return;
    setIsLoading(true);
    setJoinError('');
    try {
      await joinCoupleByInviteCode(user.uid, otpValue);
      const updated = await getUserDocument(user.uid);
      if (updated) setUser(updated);
      setAuthCookie('with_couple');
      router.replace('/');
    } catch (err) {
      const code = err instanceof Error ? err.message : 'UNKNOWN';
      setJoinError(JOIN_ERROR_MESSAGES[code] ?? '오류가 발생했어요. 다시 시도해 주세요');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col px-4 pt-4">
      <button
        className="mb-8 flex items-center gap-1 text-sm text-muted-foreground"
        onClick={() => {
          setStep('select');
          setOtpValue('');
          setJoinError('');
        }}
      >
        <ChevronLeft size={16} />
        뒤로
      </button>
      <div className="flex flex-1 flex-col items-center justify-center">
        <h2 className="mb-8 text-xl font-semibold">초대 코드를 입력하세요</h2>
        <InputOTP
          maxLength={6}
          value={otpValue}
          onChange={(val) => {
            setOtpValue(val.toUpperCase());
            setJoinError('');
          }}
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
        {joinError && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {joinError}
          </p>
        )}
        <Button
          className="mt-8 w-full max-w-sm"
          onClick={handleJoin}
          disabled={otpValue.length < 6 || isLoading}
        >
          {isLoading ? <Loader2 className="animate-spin" size={16} /> : null}
          연결하기
        </Button>
      </div>
    </main>
  );
}
