'use client';

import { useState } from 'react';
import {
  Button,
  Progress,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@uandi/ui';
import { TOUR_SLIDES, type TourContext } from './tourSlides';

type ServiceTourOverlayProps = {
  /** 둘러볼게요·건너뛰기로 닫을 때 호출 (overlay close + unmount) */
  onClose: () => void;
  /** 마지막 장 "첫 내역 적기" — 닫은 뒤 빠른 추가 시트를 여는 건 소비 측(openServiceTour) 몫 */
  onFirstEntry: () => void;
  /** 설명 문구에 쓰는 맥락(짝꿍 이름) */
  context?: TourContext;
  /** Storybook 등에서 특정 슬라이드부터 보여주기 위한 초기 스텝 */
  defaultStep?: number;
};

const DEFAULT_CONTEXT: TourContext = { partnerName: null };

/**
 * 온보딩 투어 — "첫 행동 안내" 3장 (docs/pages/01-onboarding.md 「온보딩 투어」).
 * 모바일은 전체 화면, 데스크톱(≥sm)은 가운데 카드 + 딤 배경으로 표시한다.
 * 스텝 이동/파생값은 모두 렌더·이벤트 핸들러에서 직접 계산한다(useEffect 미사용).
 * overlay-kit `<Dialog>` 래핑은 openServiceTour 헬퍼가 담당한다.
 */
export function ServiceTourOverlay({
  onClose,
  onFirstEntry,
  context = DEFAULT_CONTEXT,
  defaultStep = 0,
}: ServiceTourOverlayProps) {
  const slides = TOUR_SLIDES;
  const total = slides.length;
  const [step, setStep] = useState(defaultStep);

  const isFirst = step === 0;
  const isLast = step === total - 1;
  const progressValue = ((step + 1) / total) * 100;
  const current = slides[step];
  const Preview = current.Preview;

  const goPrev = () => setStep((s) => Math.max(s - 1, 0));
  const goNext = () => setStep((s) => Math.min(s + 1, total - 1));

  return (
    <DialogContent
      // 모바일: 전체 화면 / 데스크톱: 가운데 카드. 기본 X 닫기 버튼은 숨기고 명시적 건너뛰기를 쓴다.
      className="flex h-[100dvh] w-full max-w-full flex-col gap-0 rounded-none p-5 sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:rounded-2xl sm:p-6 [&>button]:hidden"
      data-testid="service-tour-overlay"
    >
      <DialogHeader className="space-y-3 text-left">
        <div className="flex items-center justify-between gap-2">
          <span
            className="text-xs tabular-nums text-muted-foreground"
            data-testid="tour-step-indicator"
          >
            {step + 1} / {total}
          </span>
          {!isLast ? (
            <button
              type="button"
              onClick={onClose}
              data-testid="tour-skip"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              건너뛰기
            </button>
          ) : null}
        </div>
        <Progress value={progressValue} className="h-1.5" />
        <DialogTitle className="pt-1 text-xl">{current.title}</DialogTitle>
        <DialogDescription className="whitespace-pre-line text-sm leading-relaxed">
          {current.description(context)}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-1 items-center justify-center overflow-y-auto py-6 sm:min-h-[220px]">
        <div className="w-full">
          <Preview />
        </div>
      </div>

      {isLast ? (
        <div className="flex flex-col gap-2">
          <Button type="button" size="lg" onClick={onFirstEntry} data-testid="tour-first-entry">
            첫 내역 적기
          </Button>
          <Button type="button" variant="ghost" onClick={onClose} data-testid="tour-start">
            둘러볼게요
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={goPrev}
            disabled={isFirst}
            data-testid="tour-prev"
          >
            이전
          </Button>
          <div className="flex-1" />
          <Button type="button" onClick={goNext} data-testid="tour-next">
            다음
          </Button>
        </div>
      )}
    </DialogContent>
  );
}
