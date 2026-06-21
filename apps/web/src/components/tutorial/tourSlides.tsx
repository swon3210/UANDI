'use client';

import type { FC } from 'react';
import Image, { type StaticImageData } from 'next/image';
import {
  LayoutDashboard,
  Receipt,
  ArrowRightLeft,
  Target,
  Image as ImageIcon,
  TrendingUp,
  Users,
} from 'lucide-react';
import { cn } from '@uandi/ui';
// 둘이 함께 가계부 쓰는 마스코트(환영) / 성공 마스코트(마무리). 정적 PNG라 screenshots:tour와 무관하다.
import mascotSplash from '@uandi/ui/assets/mascot-splash.png';
import mascotSuccess from '@uandi/ui/assets/mascot-success.png';

/**
 * MOA 온보딩 투어 슬라이드 정의.
 * 환영(1장)·마무리(마지막 장)는 마스코트 일러스트로 톤을 잡고,
 * 핵심 서비스인 가계부(내역/예산/현금흐름/점검)는 실제 화면 스크린샷으로 안내하며,
 * 갤러리·재테크·커뮤니티는 "그 외 기능" 한 장에 일괄 소개한다.
 * 가계부 스크린샷은 `pnpm --filter web screenshots:tour`(에뮬레이터 필요)로 갱신한다 →
 * apps/web/public/tour/*.webp. 환영(가계부 상단 탭)·그 외는 실제 데이터에 의존하지 않는 표현이다.
 * 투어 오버레이(ServiceTourOverlay)와 Storybook 스토리가 공유하는 단일 소스.
 */
export type TourSlide = {
  id: string;
  title: string;
  description: string;
  Preview: FC;
};

/** 가계부 화면 스크린샷 미리보기(공통 프레임). 실제 화면을 그대로 보여준다. */
function ScreenshotPreview({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="flex justify-center">
      <Image
        src={src}
        alt={alt}
        // 실제 스크린샷 원본 크기(760×1253)와 일치시켜야 로드 전/후 종횡비가 같아 CLS가 없다.
        // public/tour/*.webp를 재생성하면 이 값도 함께 맞춘다.
        width={760}
        height={1253}
        sizes="200px"
        className="h-auto w-[190px] rounded-2xl border border-border shadow-sm sm:w-[200px]"
      />
    </div>
  );
}

/** 마스코트 일러스트 미리보기(환영·마무리 슬라이드). 의미는 슬라이드 제목/설명이 전달하므로 alt는 비운다. */
function MascotPreview({ src, widthClassName }: { src: StaticImageData; widthClassName: string }) {
  return (
    <div className="flex justify-center">
      <Image
        src={src}
        alt=""
        sizes="240px"
        draggable={false}
        // 정적 import라 next/image가 종횡비를 알고 있어 CLS가 없다. 표시 폭만 클래스로 지정한다.
        className={cn('h-auto select-none', widthClassName)}
      />
    </div>
  );
}

/** 슬라이드 1 — 환영 + 가계부 상단 탭 4개 안내(실제 CashbookTabs와 동일한 구성) */
const CASHBOOK_TABS = [
  { label: '대시보드', Icon: LayoutDashboard },
  { label: '내역', Icon: Receipt },
  { label: '현금흐름', Icon: ArrowRightLeft },
  { label: '목표', Icon: Target },
] as const;

const WelcomePreview: FC = () => (
  <div className="space-y-4">
    <MascotPreview src={mascotSplash} widthClassName="w-[200px] sm:w-[220px]" />
    <nav className="flex items-stretch gap-1.5" aria-label="가계부 메뉴 미리보기">
      {CASHBOOK_TABS.map((t, i) => (
        <div
          key={t.label}
          className={cn(
            'flex flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-lg px-1.5 py-2.5 text-sm font-medium',
            i === 0
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted text-muted-foreground'
          )}
        >
          <t.Icon size={15} aria-hidden className="shrink-0" />
          {t.label}
        </div>
      ))}
    </nav>
  </div>
);

/** 슬라이드 2~5 — 가계부 실제 화면 스크린샷 */
const RecordPreview: FC = () => (
  <ScreenshotPreview
    src="/tour/cashbook-record.webp"
    alt="가계부 내역 화면 — 월별 수입·지출·잔액 요약과 내역 목록"
  />
);
const BudgetPreview: FC = () => (
  <ScreenshotPreview
    src="/tour/cashbook-budget.webp"
    alt="연간 예산 계획 화면 — 수입·지출·Flex 목표"
  />
);
const CashflowPreview: FC = () => (
  <ScreenshotPreview
    src="/tour/cashbook-cashflow.webp"
    alt="현금흐름 화면 — 날짜별 들어올 돈·나갈 돈"
  />
);
const SettlementPreview: FC = () => (
  <ScreenshotPreview
    src="/tour/cashbook-settlement.webp"
    alt="점검 화면 — 수입·지출·Flex 요약과 카테고리별 예산 대비 실적"
  />
);

/** 슬라이드 6 — 그 외 기능(갤러리·재테크·커뮤니티 일괄) */
const MORE_FEATURES = [
  { Icon: ImageIcon, label: '갤러리', desc: '둘의 사진을 폴더·태그로 모으고 슬라이드쇼로' },
  { Icon: TrendingUp, label: '재테크', desc: '환율·환테크와 커플 자산 합산 대시보드' },
  { Icon: Users, label: '커뮤니티', desc: '신혼부부와 살림 정보·일상 나누기' },
] as const;

const MorePreview: FC = () => (
  <div className="space-y-2">
    {MORE_FEATURES.map((m) => (
      <div
        key={m.label}
        className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <m.Icon size={18} aria-hidden />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium">{m.label}</div>
          <div className="truncate text-xs text-muted-foreground">{m.desc}</div>
        </div>
      </div>
    ))}
  </div>
);

/** 슬라이드 7 — 마무리. 성공 마스코트로 투어를 축하하며 닫는다(시작하기). */
const ReadyPreview: FC = () => (
  <MascotPreview src={mascotSuccess} widthClassName="w-[150px] sm:w-[160px]" />
);

export const TOUR_SLIDES: TourSlide[] = [
  {
    id: 'welcome',
    title: 'MOA에 오신 걸 환영해요',
    description: '둘이 함께 쓰는 가계부로 내역 입력·결산·예측 기능을 제공해요.',
    Preview: WelcomePreview,
  },
  {
    id: 'cashbook-record',
    title: '내역을 기록하고 한눈에',
    description:
      '수입·지출을 같이 기록하고 이번 달 잔액까지 한눈에.\n영수증 사진·문장으로 자동 입력도 돼요.',
    Preview: RecordPreview,
  },
  {
    id: 'cashbook-budget',
    title: '목표 세우기',
    description: '한 해 예산을 미리 세우고 월별로 분배해요.',
    Preview: BudgetPreview,
  },
  {
    id: 'cashbook-cashflow',
    title: '현금흐름으로 예측하기',
    description: '날짜별 들어올 돈·나갈 돈과 예정된 내역을 한눈에 확인해요.',
    Preview: CashflowPreview,
  },
  {
    id: 'cashbook-settlement',
    title: '점검하기',
    description:
      '(선택) 혹시 내역 입력에 틀린 게 없었는지 검증하는 기능이에요.\n취소내역·누락내역을 검증해요.',
    Preview: SettlementPreview,
  },
  {
    id: 'more',
    title: '이런 기능도 있어요 (베타)',
    description: '갤러리·재테크·커뮤니티로 둘의 일상을 더 풍성하게 채워보세요.',
    Preview: MorePreview,
  },
  {
    id: 'ready',
    title: '이제 시작해볼까요?',
    description: '둘이 함께 채워갈 가계부, 지금부터 시작이에요.',
    Preview: ReadyPreview,
  },
];
