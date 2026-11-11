'use client';

import type { FC } from 'react';
import Image, { type StaticImageData } from 'next/image';
import { useTranslations } from 'next-intl';
import { Camera, MessageSquareText, Plus } from 'lucide-react';
import { cn } from '@uandi/ui';
import mascotSplash from '@uandi/ui/assets/mascot-splash.png';
import mascotSuccess from '@uandi/ui/assets/mascot-success.png';

/**
 * 말랑 가계부 온보딩 투어 — "첫 행동 안내" 3장 (docs/pages/01-onboarding.md 「온보딩 투어」).
 * 1) 둘이 함께 쓰는 가계부 → 2) 첫 내역 적기(+ 버튼) → 3) 예산·예측은 차차.
 * 실제 화면 스크린샷은 쓰지 않는다 — UI가 바뀌어도 어긋나지 않도록 마스코트·아이콘·모형으로만 그린다.
 * 투어 오버레이(ServiceTourOverlay)와 Storybook 스토리가 공유하는 단일 소스.
 * 문구는 messages/{locale}/tour.json 에 있고, `tourSlidesFor(ctx, t)` 가 로케일에 맞춰 채운다.
 */
export type TourSlide = {
  id: 'welcome' | 'first-entry' | 'entries-ready' | 'later';
  title: string;
  description: string;
  Preview: FC;
};

export type TourContext = {
  /** 짝꿍 표시 이름. 아직 없거나 못 읽었으면 null → "짝꿍" */
  partnerName: string | null;
  /** 내역이 이미 있으면(지난 내역 가져오기 직후 등) 2장이 "내역이 들어왔어요"로 바뀐다 */
  hasEntries: boolean;
};

export type TourTranslator = ReturnType<typeof useTranslations<'tour'>>;

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
  { Icon: Camera, key: 'receipt' },
  { Icon: MessageSquareText, key: 'sentence' },
] as const;

/** 슬라이드 2 — + 버튼 모형(실제 CashbookFab과 같은 생김새) + 입력 예시 */
const FirstEntryPreview: FC = () => {
  const t = useTranslations('tour');
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
        >
          <Plus size={26} />
        </span>
        <span className="text-sm text-muted-foreground">
          {t.rich('addButtonHint', {
            br: () => <br />,
            b: (chunks) => <span className="font-semibold text-foreground">{chunks}</span>,
          })}
        </span>
      </div>
      <div className="flex gap-2">
        {ENTRY_EXAMPLES.map((e) => (
          <span
            key={e.key}
            className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground"
          >
            <e.Icon size={14} aria-hidden className="text-primary" />
            {t(`examples.${e.key}`)}
          </span>
        ))}
      </div>
    </div>
  );
};

/** 슬라이드 3 — 성공 마스코트 */
const LaterPreview: FC = () => (
  <MascotPreview src={mascotSuccess} widthClassName="w-[150px] sm:w-[160px]" />
);

/** 맥락에 맞는 3장. 내역이 있으면 2장이 "내역이 들어왔어요"로 바뀐다. */
export function tourSlidesFor(ctx: TourContext, t: TourTranslator): TourSlide[] {
  const name = ctx.partnerName?.trim();
  // 짝꿍이 아직 없으면(먼저 시작한 사람) 초대 안내로 바꾼다 — "짝꿍님과 같은 가계부"는 아직 해당이 없다.
  const welcome: TourSlide = {
    id: 'welcome',
    title: t('welcome.title'),
    description: `${name ? t('welcome.withPartner', { name }) : t('welcome.withoutPartner')}\n${t('welcome.shared')}`,
    Preview: WelcomePreview,
  };
  const firstEntry: TourSlide = {
    id: 'first-entry',
    title: t('firstEntrySlide.title'),
    description: t('firstEntrySlide.description'),
    Preview: FirstEntryPreview,
  };
  /** 내역이 이미 있을 때(지난 내역 가져오기 직후) 2장을 대신한다 */
  const entriesReady: TourSlide = {
    id: 'entries-ready',
    title: t('entriesReady.title'),
    description: t('entriesReady.description'),
    Preview: FirstEntryPreview,
  };
  const later: TourSlide = {
    id: 'later',
    title: t('later.title'),
    description: `${t('later.description')}\n${ctx.hasEntries ? t('later.hasEntries') : t('later.noEntries')}`,
    Preview: LaterPreview,
  };
  return [welcome, ctx.hasEntries ? entriesReady : firstEntry, later];
}
