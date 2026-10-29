'use client';

import Link from 'next/link';
// AI 분석 영역은 본문(Pretendard)과 다른 휴머니스트 글꼴로 데이터 카드와 구분한다
import '@fontsource/ibm-plex-sans-kr/400.css';
import '@fontsource/ibm-plex-sans-kr/500.css';
import { ChevronRight, RefreshCw, Sparkles } from 'lucide-react';
import { Button, Skeleton, cn } from '@uandi/ui';
import type { AiReportStatus } from '@/components/cashbook/AiReportCard';
import type { CategoryGroup } from '@/types';
import { formatCurrencyMan } from '@/utils/currency';

export type CompareAiSummaryItem = {
  category: string;
  color: string;
  current: number;
  /** 비교 대상 금액. null이면 이번 달 금액 자체를 변화로 본다 */
  compare: number | null;
  /** AI 한 줄 이유. 아직 없으면 생략 */
  reason?: string;
};

type Props = {
  /** 요약 대상 범위 (예: 선택한 카테고리 3개, 전체 변동 지출) */
  scopeTitle: string;
  /** 비교 대상 라벨 (예: 평소, 9월) */
  compareLabel: string;
  /** 기준 달 라벨 (예: 10월) */
  currentLabel: string;
  group: CategoryGroup;
  /** 변화가 큰 순으로 정렬된 카테고리 (최대 5개) */
  items: CompareAiSummaryItem[];
  /** 총평 두 문장 (카테고리 목록 위, `composeOverallSummary`). 없으면 생략 */
  overall?: string;
  /** AI 이유 생성 상태 (막대는 데이터라 상태와 관계없이 보인다) */
  status: AiReportStatus;
  errorMessage?: string;
  onRetry: () => void;
  /** 전체 리포트(분석 페이지) 링크 */
  href: string;
};

// 이번 달 막대는 그룹 색, 비교 대상은 회색 (기간 비교 차트와 같은 규칙)
const CURRENT_BAR: Record<CategoryGroup, string> = { expense: 'bg-expense', income: 'bg-income' };

// 증가가 좋은 그룹(수입)과 나쁜 그룹(지출)을 나눠 색을 정한다 (기간 비교와 같은 규칙)
const INCREASE_IS_GOOD: Record<CategoryGroup, boolean> = { expense: false, income: true };

function deltaOf(item: CompareAiSummaryItem): number {
  return item.current - (item.compare ?? 0);
}

/**
 * 기간 비교 아래 AI 요약 카드: 총평 두 문장 + 변화가 큰 카테고리의 비교 대상/이번 달 막대 두 줄,
 * 각 줄 아래에 AI 리포트 요약 섹션의 한 줄 이유를 붙인다. 전체 리포트는 분석 페이지에서.
 */
export function CompareAiSummary({
  scopeTitle,
  compareLabel,
  currentLabel,
  group,
  items,
  overall,
  status,
  errorMessage,
  onRetry,
  href,
}: Props) {
  // 모든 카테고리가 같은 축을 쓰도록 가장 큰 금액을 100%로
  const maxAmount = Math.max(1, ...items.flatMap((item) => [item.current, item.compare ?? 0]));
  const isWaiting = status === 'loading' || status === 'streaming';

  return (
    <section data-testid="compare-ai-summary-card" className="space-y-3 font-ai">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <Sparkles size={14} className="shrink-0 text-primary" />
          <span className="shrink-0 font-medium text-foreground">AI 요약</span>
          <span className="truncate">· {scopeTitle}</span>
        </h3>
        <span className="shrink-0 text-[11px] text-muted-foreground">{compareLabel} 대비</span>
      </div>

      {overall ? (
        <p
          data-testid="compare-ai-summary-overall"
          className="rounded-lg bg-muted/50 px-3 py-2 text-sm leading-relaxed"
        >
          {overall}
        </p>
      ) : isWaiting ? (
        <Skeleton className="h-9 w-full rounded-lg" />
      ) : null}

      <ul data-testid="compare-ai-summary" className="space-y-3">
        {items.map((item) => {
          const delta = deltaOf(item);
          const good = delta > 0 === INCREASE_IS_GOOD[group];
          const tone = delta === 0 ? 'muted' : good ? 'good' : 'bad';
          return (
            <li
              key={item.category}
              data-testid={`compare-ai-summary-item-${item.category}`}
              className="space-y-1"
            >
              <div className="flex items-center gap-2 text-sm">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate">{item.category}</span>
                <span
                  className={cn(
                    'shrink-0 text-xs font-medium tabular-nums',
                    tone === 'good' && 'text-income',
                    tone === 'bad' && 'text-expense',
                    tone === 'muted' && 'text-muted-foreground'
                  )}
                >
                  {delta === 0
                    ? '변동 없음'
                    : `${delta > 0 ? '▲' : '▼'} ${formatCurrencyMan(Math.abs(delta))}원`}
                </span>
              </div>
              <div className="space-y-0.5">
                {(
                  [
                    ['compare', compareLabel, item.compare ?? 0, 'bg-muted-foreground/35'],
                    ['current', currentLabel, item.current, CURRENT_BAR[group]],
                  ] as const
                ).map(([which, label, amount, color]) => (
                  <div
                    key={which}
                    data-testid={`compare-ai-summary-bar-${which}-${item.category}`}
                    className="flex items-center gap-2 text-[11px] text-muted-foreground"
                  >
                    <span className="w-8 shrink-0 truncate">{label}</span>
                    <span className="h-2 min-w-0 flex-1">
                      <span
                        className={cn('block h-full rounded-r-full', color)}
                        style={{
                          width: amount > 0 ? `${Math.max(1, (amount / maxAmount) * 100)}%` : 0,
                        }}
                      />
                    </span>
                    <span
                      className={cn(
                        'w-14 shrink-0 text-right tabular-nums',
                        which === 'current' && 'text-foreground'
                      )}
                    >
                      {formatCurrencyMan(amount)}원
                    </span>
                  </div>
                ))}
              </div>
              {item.reason ? (
                <p
                  data-testid={`compare-ai-summary-reason-${item.category}`}
                  className="text-xs text-muted-foreground"
                >
                  {item.reason}
                </p>
              ) : isWaiting ? (
                <Skeleton className="h-3 w-2/3" />
              ) : null}
            </li>
          );
        })}
      </ul>

      {status === 'error' ? (
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-destructive">
            {errorMessage || 'AI 요약을 만들지 못했어요. 다시 시도해 주세요'}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            data-testid="compare-ai-summary-retry"
            className="h-7 shrink-0 gap-1 px-2 text-xs"
          >
            <RefreshCw size={12} />
            다시 시도
          </Button>
        </div>
      ) : null}

      <Button asChild variant="outline" size="sm" className="w-full gap-1">
        <Link href={href} data-testid="compare-ai-analysis">
          전체 리포트 보기
          <ChevronRight size={14} />
        </Link>
      </Button>
    </section>
  );
}
