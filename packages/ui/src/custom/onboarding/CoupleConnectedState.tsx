'use client';

import { useTranslations } from 'use-intl';
import { cn } from '../../lib/utils';
import { Button } from '../../components/button';

export type CoupleConnectedStateProps = {
  /** 상대 이름. 못 읽었으면 "짝꿍" 같은 폴백을 넘긴다 */
  partnerName: string;
  /** 나 = 코랄 마스코트 (`@uandi/ui/assets/mascot-couple-coral.png`) */
  myMascotSrc: string;
  /** 짝꿍 = 세이지 마스코트 (`@uandi/ui/assets/mascot-couple-sage.png`) */
  partnerMascotSrc: string;
  onStart: () => void;
  isStarting?: boolean;
  className?: string;
};

const MASCOT_SIZE = 112;

/**
 * 커플 연결 완료 화면 — 두 마스코트가 나란히, "OO님과 연결됐어요!".
 *
 * 공간을 만든 사람(상대 합류 감지)과 합류한 사람(연결하기 성공) 양쪽이 모두 거친다.
 * 바로 대시보드로 보내지 않고 이 한 장으로 "연결의 순간"을 만든다.
 */
export function CoupleConnectedState({
  partnerName,
  myMascotSrc,
  partnerMascotSrc,
  onStart,
  isStarting = false,
  className,
}: CoupleConnectedStateProps) {
  const t = useTranslations('ui.onboarding');
  return (
    <div
      data-testid="couple-connected"
      className={cn('flex flex-col items-center px-4 text-center', className)}
    >
      <div className="flex items-end justify-center -space-x-4">
        <img
          src={myMascotSrc}
          alt=""
          width={MASCOT_SIZE}
          height={MASCOT_SIZE}
          draggable={false}
          className="select-none object-contain"
          style={{ width: MASCOT_SIZE, height: MASCOT_SIZE }}
        />
        <img
          src={partnerMascotSrc}
          alt=""
          width={MASCOT_SIZE}
          height={MASCOT_SIZE}
          draggable={false}
          className="select-none object-contain"
          style={{ width: MASCOT_SIZE, height: MASCOT_SIZE }}
        />
      </div>
      <h2 className="mt-6 text-xl font-semibold leading-snug text-foreground">
        {t('connectedTitle', { name: partnerName })}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {t('connectedDescription')}
      </p>
      <Button
        className="mt-8 w-full max-w-sm"
        size="lg"
        onClick={onStart}
        disabled={isStarting}
        data-testid="connected-start"
      >
        {t('start')}
      </Button>
    </div>
  );
}
