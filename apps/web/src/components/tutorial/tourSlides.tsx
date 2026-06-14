'use client';

import type { FC } from 'react';
import Image from 'next/image';
import { BookOpen, Image as ImageIcon, TrendingUp, Users } from 'lucide-react';
import { cn } from '@uandi/ui';

/**
 * MOA 온보딩 투어 슬라이드 정의.
 * 핵심 서비스인 가계부(내역/예산/현금흐름/결산)는 실제 화면 스크린샷으로 안내하고,
 * 갤러리·재테크·커뮤니티는 "그 외 기능" 한 장에 일괄 소개한다.
 * 가계부 스크린샷은 `pnpm --filter web screenshots:tour`(에뮬레이터 필요)로 갱신한다 →
 * apps/web/public/tour/*.webp. 환영(하단탭)·그 외는 실제 데이터에 의존하지 않는 표현이다.
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
        width={760}
        height={1476}
        sizes="200px"
        className="h-auto w-[190px] rounded-2xl border border-border shadow-sm sm:w-[200px]"
      />
    </div>
  );
}

/** 슬라이드 1 — 환영 + 하단탭 4개 안내(실제 하단탭과 동일한 구성) */
const NAV_ITEMS = [
  { label: '가계부', Icon: BookOpen },
  { label: '갤러리', Icon: ImageIcon },
  { label: '재테크', Icon: TrendingUp },
  { label: '커뮤니티', Icon: Users },
] as const;

const WelcomePreview: FC = () => (
  <div className="rounded-xl border border-border bg-card p-2">
    <div className="grid grid-cols-4 gap-1">
      {NAV_ITEMS.map((t, i) => (
        <div
          key={t.label}
          className={cn(
            'flex flex-col items-center gap-1.5 rounded-lg py-2.5 text-xs',
            i === 0 ? 'font-semibold text-primary' : 'text-muted-foreground'
          )}
        >
          <t.Icon size={22} aria-hidden />
          <span>{t.label}</span>
        </div>
      ))}
    </div>
  </div>
);

/** 슬라이드 2~5 — 가계부 실제 화면 스크린샷 */
const RecordPreview: FC = () => (
  <ScreenshotPreview src="/tour/cashbook-record.webp" alt="가계부 내역 화면 — 월별 수입·지출·잔액 요약과 내역 목록" />
);
const BudgetPreview: FC = () => (
  <ScreenshotPreview src="/tour/cashbook-budget.webp" alt="연간 예산 계획 화면 — 수입·지출·Flex 목표" />
);
const CashflowPreview: FC = () => (
  <ScreenshotPreview src="/tour/cashbook-cashflow.webp" alt="현금흐름 캘린더 화면 — 날짜별 들어올 돈·나갈 돈" />
);
const SettlementPreview: FC = () => (
  <ScreenshotPreview src="/tour/cashbook-settlement.webp" alt="월 결산 화면 — 수입·지출·Flex 요약과 카테고리별 예산 대비 실적" />
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

export const TOUR_SLIDES: TourSlide[] = [
  {
    id: 'welcome',
    title: 'MOA에 오신 걸 환영해요',
    description: '둘이 함께 쓰는 가계부를 중심으로 갤러리·재테크·커뮤니티까지. 아래 4개 탭으로 오가요.',
    Preview: WelcomePreview,
  },
  {
    id: 'cashbook-record',
    title: '내역을 기록하고 한눈에',
    description: '수입·지출을 같이 기록하고 이번 달 잔액까지 한눈에. 영수증 사진·문장으로 자동 입력도 돼요.',
    Preview: RecordPreview,
  },
  {
    id: 'cashbook-budget',
    title: '한 해 예산을 미리',
    description: '수입·지출·재테크 예산을 세우고 월별로 분배해요. 전년도 실적이 있으면 자동으로 제안해줘요.',
    Preview: BudgetPreview,
  },
  {
    id: 'cashbook-cashflow',
    title: '현금흐름을 달력으로',
    description: '날짜별 들어올 돈·나갈 돈과 예정된 내역을 한눈에 확인해요.',
    Preview: CashflowPreview,
  },
  {
    id: 'cashbook-settlement',
    title: '한 달을 결산으로 마무리',
    description: '예산 대비 실제를 비교하고, 영수증·내역 스크린샷을 올리면 빠진 내역까지 찾아줘요.',
    Preview: SettlementPreview,
  },
  {
    id: 'more',
    title: '이런 기능도 있어요',
    description: '갤러리·재테크·커뮤니티로 둘의 일상을 더 풍성하게 채워보세요.',
    Preview: MorePreview,
  },
];
