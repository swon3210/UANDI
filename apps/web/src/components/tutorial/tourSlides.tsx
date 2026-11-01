'use client';

import type { FC } from 'react';
import Image, { type StaticImageData } from 'next/image';
import { Camera, MessageSquareText, Plus } from 'lucide-react';
import { cn } from '@uandi/ui';
import mascotSplash from '@uandi/ui/assets/mascot-splash.png';
import mascotSuccess from '@uandi/ui/assets/mascot-success.png';

/**
 * 말랑 가계부 온보딩 투어 — "첫 행동 안내" 3장 (docs/pages/01-onboarding.md 「온보딩 투어」).
 * 1) 둘이 함께 쓰는 가계부 → 2) 첫 내역 적기(+ 버튼) → 3) 예산·예측은 차차.
 * 실제 화면 스크린샷은 쓰지 않는다 — UI가 바뀌어도 어긋나지 않도록 마스코트·아이콘·모형으로만 그린다.
 * 투어 오버레이(ServiceTourOverlay)와 Storybook 스토리가 공유하는 단일 소스.
 */
export type TourSlide = {
  id: 'welcome' | 'first-entry' | 'later';
  title: string;
  /** 짝꿍 이름 등 맥락을 받아 설명 문구를 만든다 */
  description: (ctx: TourContext) => string;
  Preview: FC;
};

export type TourContext = {
  /** 짝꿍 표시 이름. 아직 없거나 못 읽었으면 null → "짝꿍" */
  partnerName: string | null;
};

/** 마스코트 일러스트 미리보기. 의미는 슬라이드 제목/설명이 전달하므로 alt는 비운다. */
function MascotPreview({ src, widthClassName }: { src: StaticImageData; widthClassName: string }) {
  return (
    <div className="flex justify-center">
      <Image
        src={src}
        alt=""
        sizes="240px"
        draggable={false}
        className={cn('h-auto select-none', widthClassName)}
      />
    </div>
  );
}

/** 슬라이드 1 — 둘이 가계부 쓰는 마스코트 */
const WelcomePreview: FC = () => (
  <MascotPreview src={mascotSplash} widthClassName="w-[220px] sm:w-[240px]" />
);

/** 입력 예시 칩 — 사진·문장만으로도 내역이 채워진다는 것을 보여준다 */
const ENTRY_EXAMPLES = [
  { Icon: Camera, label: '영수증 사진' },
  { Icon: MessageSquareText, label: '"점심 만원"' },
] as const;

/** 슬라이드 2 — + 버튼 모형(실제 CashbookFab과 같은 생김새) + 입력 예시 */
const FirstEntryPreview: FC = () => (
  <div className="flex flex-col items-center gap-5">
    <div className="flex items-center gap-3">
      <span
        aria-hidden
        className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
      >
        <Plus size={26} />
      </span>
      <span className="text-sm text-muted-foreground">
        오른쪽 아래에 있는
        <br />
        <span className="font-semibold text-foreground">내역 추가</span> 버튼
      </span>
    </div>
    <div className="flex gap-2">
      {ENTRY_EXAMPLES.map((e) => (
        <span
          key={e.label}
          className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground"
        >
          <e.Icon size={14} aria-hidden className="text-primary" />
          {e.label}
        </span>
      ))}
    </div>
  </div>
);

/** 슬라이드 3 — 성공 마스코트 */
const LaterPreview: FC = () => (
  <MascotPreview src={mascotSuccess} widthClassName="w-[150px] sm:w-[160px]" />
);

const partnerLabel = (ctx: TourContext) => ctx.partnerName?.trim() || '짝꿍';

export const TOUR_SLIDES: TourSlide[] = [
  {
    id: 'welcome',
    title: '둘이 함께 쓰는 가계부예요',
    description: (ctx) =>
      `${partnerLabel(ctx)}님과 같은 가계부를 봐요.\n둘 중 누가 적어도 바로 함께 보여요.`,
    Preview: WelcomePreview,
  },
  {
    id: 'first-entry',
    title: '첫 내역을 적어 볼까요?',
    description: () =>
      "오른쪽 아래 + 버튼을 누르면 돼요.\n영수증 사진이나 '점심 만원' 같은 문장만 적어도 자동으로 채워져요.",
    Preview: FirstEntryPreview,
  },
  {
    id: 'later',
    title: '예산과 예측은 차차 같이',
    description: () =>
      '한 해 예산은 곧 같이 세울 거예요.\n현금흐름 예측과 점검은 내역이 쌓일수록 정확해져요.\n지금은 첫 내역 하나면 충분해요.',
    Preview: LaterPreview,
  },
];
