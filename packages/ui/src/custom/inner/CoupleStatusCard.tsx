'use client';

import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../../components/button';
import { Skeleton } from '../../components/skeleton';

/** 한마디 최대 길이 (편집 UI에서 강제, 표시에선 line-clamp). */
export const COUPLE_MESSAGE_MAX = 30;

export type CoupleStatusPerson = {
  /** 표시 이름 */
  name: string;
  /** 한마디. 없으면 null → placeholder 표시 */
  message: string | null;
  /**
   * 마스코트 이미지 경로. 관례상 나 = 코랄, 짝꿍 = 세이지.
   * 소비 측이 `@uandi/ui/assets/mascot-couple-*.png` 에서 주입한다.
   */
  mascotSrc: string;
};

export type CoupleStatusCardProps =
  | { state: 'loading'; className?: string }
  | {
      /** 커플 미연결 — 짝꿍 초대 CTA */
      state: 'invite';
      /** 커플이 함께 있는 마스코트 (splash) 경로 */
      mascotSrc: string;
      onInvite: () => void;
      className?: string;
    }
  | {
      state: 'connected';
      /** 왼쪽 = 나 (코랄). 한마디를 쓰는 자리 */
      me: CoupleStatusPerson;
      /** 오른쪽 = 짝꿍 (세이지). 접속 상태 + 한마디를 보는 자리 */
      partner: CoupleStatusPerson;
      /** 짝꿍 접속 상태 */
      partnerPresence: 'online' | 'offline';
      /**
       * 이미 포맷된 상대시간 라벨. 예: '조금 전', '2시간 전'.
       * (dayjs().fromNow() 는 소비 측에서 계산 — 프리미티브는 순수 유지)
       */
      partnerLastSeenLabel?: string;
      /** 짝꿍이 한마디를 바꿨을 때 하이라이트 */
      hasUnreadPartnerMessage?: boolean;
      /** 내 말풍선/마스코트 탭 → 편집 시트 열기 (overlay-kit 는 소비 측) */
      onEditMyMessage: () => void;
      className?: string;
    };

const MASCOT_SIZE = 88;

/** 카드 외곽 — 우리집 톤(코랄→세이지) 그라데이션 */
function CardShell({
  className,
  children,
  testId,
}: {
  className?: string;
  children: ReactNode;
  testId?: string;
}) {
  return (
    <div
      data-testid={testId}
      className={cn(
        'rounded-2xl border bg-gradient-to-br from-coral-50 to-sage-50 p-4 shadow-sm',
        className
      )}
    >
      {children}
    </div>
  );
}

/** 한마디 말풍선 (코랄=나 / 세이지=짝꿍 톤) */
function MessageBubble({
  tone,
  message,
  placeholder,
  as = 'div',
  onClick,
  testId,
}: {
  tone: 'coral' | 'sage';
  message: string | null;
  placeholder: string;
  as?: 'div' | 'button';
  onClick?: () => void;
  testId?: string;
}) {
  const isEmpty = message == null || message.trim() === '';
  const content = (
    <span className="line-clamp-2 break-words">{isEmpty ? placeholder : message}</span>
  );
  const base = cn(
    'inline-block max-w-[9.5rem] rounded-2xl px-3 py-2 text-center text-sm leading-snug',
    tone === 'coral' ? 'bg-coral-100 text-coral-900' : 'bg-sage-100 text-sage-700',
    isEmpty && 'border border-dashed bg-transparent italic text-muted-foreground'
  );

  if (as === 'button') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label="한마디 수정"
        data-testid={testId}
        className={cn(
          base,
          'transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
        )}
      >
        {content}
      </button>
    );
  }
  return (
    <div className={base} data-testid={testId}>
      {content}
    </div>
  );
}

function Mascot({ src, name, dimmed }: { src: string; name: string; dimmed?: boolean }) {
  return (
    <img
      src={src}
      alt={`${name} 마스코트`}
      width={MASCOT_SIZE}
      height={MASCOT_SIZE}
      draggable={false}
      className={cn('select-none object-contain transition-all', dimmed && 'opacity-60 grayscale')}
      style={{ width: MASCOT_SIZE, height: MASCOT_SIZE }}
    />
  );
}

/**
 * 대시보드 최상단 "커플 카드" — 무상태 프레젠테이션.
 *
 * 왼쪽(나·코랄)은 한마디를 **쓰는** 자리, 오른쪽(짝꿍·세이지)은 접속 상태와
 * 한마디를 **보는** 자리로 비대칭 구성한다. 데이터 조회·상대시간 포맷·편집 오버레이는
 * 모두 소비 측이 담당하고, 이 컴포넌트는 props 로 받은 값만 렌더한다.
 */
export function CoupleStatusCard(props: CoupleStatusCardProps) {
  if (props.state === 'loading') {
    return (
      <CardShell className={props.className} testId="couple-status-loading">
        <div className="grid grid-cols-2 gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className="h-6 w-28 rounded-2xl" />
              <Skeleton className="h-[88px] w-[88px] rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </CardShell>
    );
  }

  if (props.state === 'invite') {
    return (
      <CardShell className={props.className} testId="couple-status-invite">
        <div className="flex flex-col items-center gap-2 py-2 text-center">
          <Mascot src={props.mascotSrc} name="우리 커플" />
          <p className="text-base font-semibold text-foreground">짝꿍과 함께 시작해요</p>
          <p className="text-sm text-muted-foreground">
            초대하면 서로의 접속 상태와 한마디를 주고받을 수 있어요
          </p>
          <Button className="mt-2" onClick={props.onInvite}>
            짝꿍 초대하기
          </Button>
        </div>
      </CardShell>
    );
  }

  const { me, partner, partnerPresence, partnerLastSeenLabel, hasUnreadPartnerMessage } = props;
  const isOnline = partnerPresence === 'online';

  return (
    <CardShell className={props.className} testId="couple-status-card">
      <div className="grid grid-cols-2 items-end gap-3">
        {/* 왼쪽: 나 (코랄) — 한마디를 쓰는 자리 */}
        <div className="flex flex-col items-center gap-2">
          <MessageBubble
            tone="coral"
            message={me.message}
            placeholder="한마디 남기기"
            as="button"
            onClick={props.onEditMyMessage}
            testId="couple-message-edit"
          />
          <Mascot src={me.mascotSrc} name={me.name} />
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">{me.name}</p>
            <p className="text-xs text-muted-foreground">탭해서 수정</p>
          </div>
        </div>

        {/* 오른쪽: 짝꿍 (세이지) — 접속 상태 + 한마디를 보는 자리 */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            {hasUnreadPartnerMessage ? (
              <span className="absolute -top-2 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-coral-400 px-2 py-0.5 text-[10px] font-medium text-white shadow-sm">
                새 한마디
              </span>
            ) : null}
            <MessageBubble
              tone="sage"
              message={partner.message}
              placeholder="아직 한마디가 없어요"
            />
          </div>
          <div className="relative">
            <Mascot src={partner.mascotSrc} name={partner.name} dimmed={!isOnline} />
            {/* 접속 점 */}
            <span
              className={cn(
                'absolute right-1 top-1 size-3 rounded-full ring-2 ring-white',
                isOnline ? 'bg-sage-400' : 'bg-muted-foreground'
              )}
            >
              <span className="sr-only">{isOnline ? '접속 중' : '오프라인'}</span>
            </span>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">{partner.name}</p>
            <p className="text-xs">
              {isOnline ? (
                <span className="font-medium text-sage-600">접속 중</span>
              ) : (
                <span className="text-muted-foreground">
                  {partnerLastSeenLabel ? `${partnerLastSeenLabel} 접속` : '오프라인'}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </CardShell>
  );
}
