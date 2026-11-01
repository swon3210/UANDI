'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAtomValue, useSetAtom } from 'jotai';
import { Loader2, ChevronLeft, Home, Mail } from 'lucide-react';
import { useCopyToClipboard } from '@uidotdev/usehooks';
import {
  Button,
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  Logo,
  OnboardingChoiceCard,
  InviteCodePanel,
  InviteCodeHint,
  CoupleConnectedState,
} from '@uandi/ui';
import type { InviteCodeHintStatus } from '@uandi/ui';
import coralMascot from '@uandi/ui/assets/mascot-couple-coral.png';
import sageMascot from '@uandi/ui/assets/mascot-couple-sage.png';
import { userAtom, authStatusAtom } from '@/stores/auth.store';
import { setAuthCookie } from '@/lib/auth-cookie';
import { consumePendingInviteCode } from '@/lib/invite-code';
import { shareInviteLink } from '@/lib/share-invite';
import {
  createCouple,
  joinCoupleByInviteCode,
  previewInviteCode,
  subscribeToCouple,
} from '@/services/couple';
import { getUserDocumentWithRetry } from '@/services/user';

type Step = 'select' | 'create_pending' | 'join' | 'connected';

const JOIN_ERROR_MESSAGES: Record<string, string> = {
  INVITE_CODE_NOT_FOUND: '존재하지 않는 초대 코드예요',
  INVITE_CODE_EXPIRED: '초대 코드가 만료됐어요. 상대방에게 새 코드를 요청해 주세요',
  COUPLE_ALREADY_FULL: '이미 연결된 커플이에요',
  CANNOT_JOIN_OWN_COUPLE: '내가 만든 코드예요. 상대방에게 공유해 주세요',
};

const PARTNER_FALLBACK_NAME = '짝꿍';

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
  const [hint, setHint] = useState<{ status: InviteCodeHintStatus; inviterName: string | null }>({
    status: 'idle',
    inviterName: null,
  });
  const [partnerName, setPartnerName] = useState(PARTNER_FALLBACK_NAME);
  const [, copyToClipboard] = useCopyToClipboard();
  const [copied, setCopied] = useState(false);
  // 미리보기 요청 순서 보장 — 느린 응답이 최신 입력을 덮어쓰지 않게
  const previewSeqRef = useRef(0);
  // 초대 링크 코드는 한 번만 자동 적용
  const pendingAppliedRef = useRef(false);
  // enterApp이 목적지(지난 내역 가져오기)로 보내는 중이면 라우트 보호가 '/'로 가로채지 않게 한다
  const leavingRef = useRef(false);

  // 라우트 보호
  useEffect(() => {
    if (authStatus === 'unauthenticated') router.replace('/');
    if (authStatus === 'authenticated_with_couple' && !leavingRef.current) router.replace('/');
  }, [authStatus, router]);

  /** 6자리가 채워지면 초대한 사람 미리보기를 조회한다 (입력 핸들러에서 직접 호출) */
  const runPreview = async (code: string) => {
    if (!user) return;
    const seq = ++previewSeqRef.current;
    setHint({ status: 'loading', inviterName: null });
    try {
      const preview = await previewInviteCode(code, user.uid);
      if (seq !== previewSeqRef.current) return;
      setHint(
        preview
          ? { status: 'found', inviterName: preview.inviterName }
          : { status: 'unavailable', inviterName: null }
      );
    } catch {
      if (seq === previewSeqRef.current) setHint({ status: 'unavailable', inviterName: null });
    }
  };

  // 초대 링크(/invite/{code})로 들어온 경우 — 저장된 코드(외부 시스템)를 한 번 읽어 입력 화면을 바로 연다
  useEffect(() => {
    if (authStatus !== 'authenticated_no_couple' || pendingAppliedRef.current) return;
    pendingAppliedRef.current = true;
    const code = consumePendingInviteCode();
    if (!code) return;
    setStep('join');
    setOtpValue(code);
    void runPreview(code);
    // runPreview는 user만 참조하며 user는 authStatus와 함께 확정된다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus]);

  // 상대방이 합류하면(Firestore 리스너) 연결 완료 화면으로
  useEffect(() => {
    if (step !== 'create_pending' || !coupleId || !user) return;

    let cancelled = false;
    const unsubscribe = subscribeToCouple(coupleId, async (couple) => {
      if (couple.memberUids.length < 2) return;
      unsubscribe();
      const partnerUid = couple.memberUids.find((uid) => uid !== user.uid);
      const partner = partnerUid ? await getUserDocumentWithRetry(partnerUid) : null;
      if (cancelled) return;
      setPartnerName(partner?.displayName?.trim() || PARTNER_FALLBACK_NAME);
      setStep('connected');
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [step, coupleId, user]);

  /**
   * 앱으로 진입 — 쿠키와 userAtom을 커플 연결 상태로 맞추고(새로고침 불필요)
   * 지난 내역 가져오기(건너뛰기 가능)로 보낸다. docs/pages/inner/cashbook-import.md
   */
  const enterApp = (targetCoupleId: string) => {
    if (!user) return;
    leavingRef.current = true;
    setAuthCookie('with_couple');
    setUser({ ...user, coupleId: targetCoupleId });
    router.replace('/inner/cashbook/import?onboarding=1');
  };

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
        <Logo variant="full" className="mb-2 h-10 w-auto" aria-label="말랑 가계부" />
        <p className="mb-10 text-muted-foreground">함께 모아가는 즐거움</p>
        <div className="flex w-full max-w-sm flex-col gap-3">
          <OnboardingChoiceCard
            icon={<Home size={22} />}
            title="처음 시작해요"
            description="새 공간을 만들고 짝꿍을 초대해요"
            ariaLabel="새 커플 공간 만들기"
            testId="choice-create"
            onClick={async () => {
              if (!user || isLoading) return;
              setIsLoading(true);
              try {
                const result = await createCouple(user.uid, user.displayName);
                setInviteCode(result.inviteCode);
                setCoupleId(result.coupleId);
                setStep('create_pending');
              } finally {
                setIsLoading(false);
              }
            }}
          />
          <OnboardingChoiceCard
            icon={<Mail size={22} />}
            title="초대 코드를 받았어요"
            description="짝꿍이 보낸 6자리 코드로 합류해요"
            ariaLabel="초대 코드 입력하기"
            testId="choice-join"
            onClick={() => setStep('join')}
          />
        </div>
        {isLoading ? (
          <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="animate-spin" size={14} />
            공간을 만드는 중…
          </p>
        ) : null}
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
          <h2 className="mb-2 text-xl font-semibold">짝꿍을 초대해요</h2>
          <p className="mb-8 text-center text-sm text-muted-foreground">
            코드나 링크를 짝꿍에게 보내 주세요
          </p>
          <InviteCodePanel
            code={inviteCode}
            copied={copied}
            onCopy={handleCopy}
            onShare={() => shareInviteLink(inviteCode, copyToClipboard)}
            onStart={() => enterApp(coupleId)}
            className="w-full"
          />
        </div>
      </main>
    );
  }

  // ── 단계 3: 연결 완료 ─────────────────────────────────────────
  if (step === 'connected') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4">
        <CoupleConnectedState
          partnerName={partnerName}
          myMascotSrc={coralMascot.src}
          partnerMascotSrc={sageMascot.src}
          onStart={() => enterApp(coupleId)}
        />
      </main>
    );
  }

  // ── 단계 2B: 초대 코드 입력 ────────────────────────────────────
  const handleJoin = async () => {
    if (!user || otpValue.length < 6) return;
    setIsLoading(true);
    setJoinError('');
    try {
      const result = await joinCoupleByInviteCode(user.uid, otpValue);
      setCoupleId(result.coupleId);
      const partner = await getUserDocumentWithRetry(result.partnerUid);
      setPartnerName(partner?.displayName?.trim() || PARTNER_FALLBACK_NAME);
      setStep('connected');
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
          previewSeqRef.current += 1;
          setStep('select');
          setOtpValue('');
          setJoinError('');
          setHint({ status: 'idle', inviterName: null });
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
            const next = val.toUpperCase();
            setOtpValue(next);
            setJoinError('');
            if (next.length === 6) {
              void runPreview(next);
            } else {
              previewSeqRef.current += 1;
              setHint({ status: 'idle', inviterName: null });
            }
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
        <InviteCodeHint status={hint.status} inviterName={hint.inviterName} className="mt-3" />
        {joinError && (
          <p role="alert" data-testid="join-error" className="mt-3 text-sm text-destructive">
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
