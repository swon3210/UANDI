'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Skeleton, cn } from '@uandi/ui';
import type { CategoryGroup } from '@/types';
import { formatCurrency } from '@/utils/currency';
import {
  MEDIAN_MIN_SAMPLE_MONTHS,
  MEDIAN_WINDOW_MONTHS,
  type CategoryHighlight,
  type HighlightKind,
  type MedianComparison,
} from '@/utils/median-comparison';

type Props = {
  /** null = 기록 있는 달이 부족해 비교할 수 없음 */
  comparison: MedianComparison | null;
  /** 지난 달 데이터 로딩 중이면 스켈레톤 */
  isLoading?: boolean;
  group: CategoryGroup;
  /** 카테고리 행을 누르면 이동할 분석 페이지 링크. 없으면 행은 읽기 전용 */
  hrefOf?: (category: string) => string;
};

// 증가가 좋은 그룹(수입)과 나쁜 그룹(지출)을 나눠 색·이모지를 정한다 (기간 비교와 같은 규칙)
const INCREASE_IS_GOOD: Record<CategoryGroup, boolean> = {
  expense: false,
  income: true,
};

const VERB: Record<CategoryGroup, { more: string; less: string }> = {
  expense: { more: '많이 썼어요', less: '적게 썼어요' },
  income: { more: '많이 들어왔어요', less: '적게 들어왔어요' },
};

// 행 맨 앞 기호: 많이 ▲ / 적게 ▼ / 이번 달 없음 – / 새로 생김 ✦
const KIND_GLYPH: Record<HighlightKind, string> = {
  high: '▲',
  low: '▼',
  missing: '–',
  new: '✦',
};

/** 증가 계열(high·new)이면 그룹의 좋은/나쁜 방향과 합쳐 색을 정한다 */
function toneClass(kind: HighlightKind, group: CategoryGroup): string {
  const increase = kind === 'high' || kind === 'new';
  return increase === INCREASE_IS_GOOD[group] ? 'text-income' : 'text-expense';
}

function formatRate(delta: number, base: number): string {
  return base === 0 ? '' : ` (${Math.round((Math.abs(delta) / base) * 100)}%)`;
}

function Headline({
  current,
  median,
  group,
}: MedianComparison['total'] & { group: CategoryGroup }) {
  const delta = current - median;
  if (delta === 0) return <span className="text-muted-foreground">평소와 같아요</span>;
  const increase = delta > 0;
  const good = increase === INCREASE_IS_GOOD[group];
  return (
    <>
      {/* 좋은 변화(지출 감소·수입 증가)는 😎, 나쁜 변화는 🚨 */}
      <span data-testid="median-compare-delta-emoji">{good ? '😎' : '🚨'} </span>
      <span className="text-muted-foreground">평소보다 </span>
      <span className={cn('font-extrabold tabular-nums', good ? 'text-income' : 'text-expense')}>
        {increase ? '▲' : '▼'} {formatCurrency(Math.abs(delta))}
        {formatRate(delta, median)}
      </span>
      <span className="text-muted-foreground">
        {' '}
        {increase ? VERB[group].more : VERB[group].less}
      </span>
    </>
  );
}

function HighlightRow({
  item,
  group,
  href,
}: {
  item: CategoryHighlight;
  group: CategoryGroup;
  href?: string;
}) {
  const tone = toneClass(item.kind, group);
  const body = (
    <>
      <span className={cn('w-4 shrink-0 text-center text-xs', tone)} aria-hidden>
        {KIND_GLYPH[item.kind]}
      </span>
      <span className="min-w-0 flex-1 truncate">{item.category}</span>
      <span className="shrink-0 text-[11px] text-muted-foreground">
        {item.kind === 'new' ? '평소엔 없음' : `평소 ${formatCurrency(item.median)}`}
      </span>
      <span className={cn('w-24 shrink-0 text-right font-semibold tabular-nums', tone)}>
        {formatCurrency(item.current)}
      </span>
    </>
  );
  const rowClass = 'flex items-center gap-2 py-1.5 text-sm';
  return (
    <li>
      {href ? (
        // 누르면 그 카테고리의 AI 분석 페이지로
        <Link
          href={href}
          data-testid={`median-highlight-${item.category}`}
          data-kind={item.kind}
          aria-label={`${item.category} AI 분석 보기`}
          className={cn(rowClass, '-mx-1 rounded-md px-1 transition-colors hover:bg-accent/40')}
        >
          {body}
          <ChevronRight size={14} className="shrink-0 text-muted-foreground" aria-hidden />
        </Link>
      ) : (
        <div
          data-testid={`median-highlight-${item.category}`}
          data-kind={item.kind}
          className={rowClass}
        >
          {body}
        </div>
      )}
    </li>
  );
}

export function MedianCompareCard({ comparison, isLoading = false, group, hrefOf }: Props) {
  return (
    <div data-testid="median-compare" className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">평소와 비교</span>
        <span className="text-[11px] text-muted-foreground" data-testid="median-compare-caption">
          최근 {MEDIAN_WINDOW_MONTHS}개월 중위값
        </span>
      </div>

      {isLoading ? (
        <Skeleton className="h-[120px] w-full rounded-lg" />
      ) : !comparison ? (
        <p data-testid="median-compare-empty" className="text-xs text-muted-foreground">
          지난달 기록이 {MEDIAN_MIN_SAMPLE_MONTHS}개월 이상 쌓이면 평소와 비교해 드려요
        </p>
      ) : (
        <>
          <div
            data-testid="median-compare-delta"
            className="rounded-lg bg-muted/50 px-3 py-2 text-sm font-semibold"
          >
            <Headline {...comparison.total} group={group} />
          </div>
          <p
            data-testid="median-compare-summary"
            className="text-[11px] text-muted-foreground tabular-nums"
          >
            이번 달 {formatCurrency(comparison.total.current)} · 평소{' '}
            {formatCurrency(comparison.total.median)}
          </p>

          {comparison.highlights.length === 0 ? (
            <p data-testid="median-compare-none" className="text-xs text-muted-foreground">
              눈에 띄는 카테고리는 없어요
            </p>
          ) : (
            <ul data-testid="median-compare-highlights" className="divide-y divide-border">
              {comparison.highlights.map((item) => (
                <HighlightRow
                  key={item.category}
                  item={item}
                  group={group}
                  href={hrefOf?.(item.category)}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
