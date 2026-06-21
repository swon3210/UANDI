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
import { TOUR_SLIDES } from './tourSlides';

type ServiceTourOverlayProps = {
  /** 시작하기·건너뛰기로 닫을 때 호출 (overlay close + unmount) */
  onClose: () => void;
  /** Storybook 등에서 특정 슬라이드부터 보여주기 위한 초기 스텝 */
  defaultStep?: number;
};

/**
 * MOA 서비스 전반(가계부·갤러리·재테크·커뮤니티)을 7장으로 안내하는 풀스크린 온보딩 투어.
 * (환영·마무리는 마스코트 일러스트, 그 사이는 가계부 핵심 기능 + 그 외 기능 소개)
 * 모바일은 전체 화면, 데스크톱(≥sm)은 가운데 카드 + 딤 배경으로 표시한다.
 * 스텝 이동/파생값은 모두 렌더·이벤트 핸들러에서 직접 계산한다(useEffect 미사용).
 * overlay-kit `<Dialog>` 래핑은 openServiceTour 헬퍼가 담당한다.
 */
export function ServiceTourOverlay({ onClose, defaultStep = 0 }: ServiceTourOverlayProps) {
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
        <DialogDescription className="whitespace-pre-line text-sm">
          {current.description}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-1 items-center justify-center overflow-y-auto py-6 sm:min-h-[220px]">
        <div className="w-full">
          <Preview />
        </div>
      </div>

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
        {isLast ? (
          <Button type="button" onClick={onClose} data-testid="tour-start">
            시작하기
          </Button>
        ) : (
          <Button type="button" onClick={goNext} data-testid="tour-next">
            다음
          </Button>
        )}
      </div>
    </DialogContent>
  );
}
