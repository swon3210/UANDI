'use client';

import { useState } from 'react';
import { CircleDashed, Hourglass, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';
import { Badge, Button, Skeleton, cn } from '@uandi/ui';
import type { CategoryGroup } from '@/types';
import { formatCurrency } from '@/utils/currency';
import {
  HIGHLIGHT_VISIBLE_COUNT,
  MEDIAN_MIN_SAMPLE_MONTHS,
  MEDIAN_WINDOW_MONTHS,
  type CategoryHighlight,
  type HighlightKind,
  type MedianComparison,
} from '@/utils/median-comparison';

type Props = {
  /** null = 기록 있는 달이 부족해 비교할 수 없음 */
  comparison: MedianComparison | null;
  /** 지난 달 데이터 로딩 중이면 요약·목록 대신 스켈레톤 */
  isLoading?: boolean;
  group: CategoryGroup;
  /** 기준 달 라벨 (예: 2026년 10월) */
  currentLabel: string;
  /** 기준 달이 아직 진행 중이면 오늘이 며칠인지. 지난 달이면 생략 */
  ongoingDay?: number;
  /** 카테고리 색 점 (도넛과 같은 색). 없으면 중립색 */
  colorOf?: (category: string) => string;
};

// 요약 칸 색: 이번 달은 그룹 시맨틱 색, 평소(중위값)는 회색
const CURRENT_COLOR: Record<CategoryGroup, string> = {
  expense: 'hsl(var(--expense))',
  income: 'hsl(var(--income))',
};
const MEDIAN_COLOR = 'hsl(var(--muted-foreground) / 0.35)';
const NEUTRAL_CATEGORY_COLOR = 'hsl(var(--muted-foreground))';

// 증가가 좋은 그룹(수입)과 나쁜 그룹(지출)을 나눠 색·이모지를 정한다 (기간 비교와 같은 규칙)
const INCREASE_IS_GOOD: Record<CategoryGroup, boolean> = {
  expense: false,
  income: true,
};

const VERB: Record<CategoryGroup, { more: string; less: string }> = {
  expense: { more: '많이 썼어요', less: '적게 썼어요' },
  income: { more: '많이 들어왔어요', less: '적게 들어왔어요' },
};

const KIND_ICON: Record<HighlightKind, typeof TrendingUp> = {
  high: TrendingUp,
  low: TrendingDown,
  missing: CircleDashed,
  new: Sparkles,
};

const RECORD_LABEL = {
  max: `최근 ${MEDIAN_WINDOW_MONTHS}개월 최고`,
  min: `최근 ${MEDIAN_WINDOW_MONTHS}개월 최저`,
} as const;

/** 증가 계열(high·new)인지 — 색을 고를 때 그룹의 좋은/나쁜 방향과 합친다 */
function isIncrease(kind: HighlightKind): boolean {
  return kind === 'high' || kind === 'new';
}

function toneClass(increase: boolean, group: CategoryGroup): string {
  return increase === INCREASE_IS_GOOD[group] ? 'text-income' : 'text-expense';
}

function formatRate(delta: number, base: number): string {
  if (base === 0) return '';
  return ` (${Math.round((Math.abs(delta) / base) * 100)}%)`;
}

function DeltaSummary({
  current,
  median,
  group,
}: {
  current: number;
  median: number;
  group: CategoryGroup;
}) {
  const delta = current - median;
  if (delta === 0) {
    return <span className="text-muted-foreground">평소와 같아요</span>;
  }
  const increase = delta > 0;
  const good = increase === INCREASE_IS_GOOD[group];
  return (
    <>
      {/* 좋은 변화(지출 감소·수입 증가)는 😎, 나쁜 변화는 🚨 */}
      <span data-testid="median-compare-delta-emoji">{good ? '😎' : '🚨'} </span>
      <span className="text-muted-foreground">평소보다 </span>
      <span className={cn('font-extrabold tabular-nums', toneClass(increase, group))}>
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

function HighlightDetail({ item }: { item: CategoryHighlight }) {
  const typical = `평소 ${formatCurrency(item.median)}`;
  switch (item.kind) {
    case 'missing':
      return `${typical} · 이번 달엔 아직 없어요`;
    case 'new':
      return item.seenMonths === 0
        ? `지난 ${MEDIAN_WINDOW_MONTHS}개월엔 없던 항목`
        : `평소엔 드문 항목 (${item.seenMonths}개월만 기록)`;
    default: {
      const delta = item.current - item.median;
      return `${typical} · ${delta > 0 ? '▲' : '▼'} ${formatCurrency(Math.abs(delta))}${formatRate(delta, item.median)}`;
    }
  }
}

function HighlightRow({
  item,
  group,
  color,
}: {
  item: CategoryHighlight;
  group: CategoryGroup;
  color: string;
}) {
  const Icon = KIND_ICON[item.kind];
  const tone = toneClass(isIncrease(item.kind), group);
  return (
    <li
      data-testid={`median-highlight-${item.category}`}
      data-kind={item.kind}
      className="flex items-center gap-2.5 py-2"
    >
      <Icon size={16} className={cn('shrink-0', tone)} aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: color }}
            aria-hidden
          />
          <span className="truncate text-sm font-medium">{item.category}</span>
          {item.record ? (
            <Badge
              variant="secondary"
              data-testid={`median-highlight-record-${item.category}`}
              className="shrink-0 px-1.5 py-0 text-[10px] font-medium"
            >
              {RECORD_LABEL[item.record]}
            </Badge>
          ) : null}
        </div>
        <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
          <HighlightDetail item={item} />
        </div>
      </div>
      <span className={cn('shrink-0 text-sm font-semibold tabular-nums', tone)}>
        {formatCurrency(item.current)}
      </span>
    </li>
  );
}

export function MedianCompareCard({
  comparison,
  isLoading = false,
  group,
  currentLabel,
  ongoingDay,
  colorOf,
}: Props) {
  const [showAll, setShowAll] = useState(false);
  const highlights = comparison?.highlights ?? [];
  const visible = showAll ? highlights : highlights.slice(0, HIGHLIGHT_VISIBLE_COUNT);
  const hiddenCount = highlights.length - visible.length;

  return (
    <div data-testid="median-compare" className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">평소와 비교</span>
        <span className="text-[11px] text-muted-foreground" data-testid="median-compare-caption">
          최근 {MEDIAN_WINDOW_MONTHS}개월 중위값
          {comparison ? ` · ${comparison.sampleMonths}개월 기록` : ''}
        </span>
      </div>

      {isLoading ? (
        <Skeleton className="h-[160px] w-full rounded-lg" />
      ) : !comparison ? (
        <div
          data-testid="median-compare-empty"
          className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-3 text-xs text-muted-foreground"
        >
          <Hourglass size={18} className="shrink-0" aria-hidden />
          <span>지난달 기록이 {MEDIAN_MIN_SAMPLE_MONTHS}개월 이상 쌓이면 평소와 비교해 드려요</span>
        </div>
      ) : (
        <>
          <div data-testid="median-compare-summary" className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-muted/50 px-3 py-2">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: CURRENT_COLOR[group] }}
                />
                <span className="truncate">{currentLabel}</span>
              </div>
              <div className="mt-0.5 text-sm font-semibold tabular-nums">
                {formatCurrency(comparison.total.current)}
              </div>
            </div>
            <div className="rounded-lg bg-muted/50 px-3 py-2">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: MEDIAN_COLOR }}
                />
                <span className="truncate">평소 (중위값)</span>
              </div>
              <div className="mt-0.5 text-sm font-semibold tabular-nums">
                {formatCurrency(comparison.total.median)}
              </div>
            </div>
          </div>

          <div
            data-testid="median-compare-delta"
            className="rounded-lg bg-muted/50 px-3 py-2 text-sm font-semibold"
          >
            <DeltaSummary
              current={comparison.total.current}
              median={comparison.total.median}
              group={group}
            />
          </div>

          {ongoingDay !== undefined ? (
            <p data-testid="median-compare-ongoing" className="text-[11px] text-muted-foreground">
              이번 달은 아직 진행 중이에요 ({ongoingDay}일 기준)
            </p>
          ) : null}

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">
              눈에 띄는 카테고리 {highlights.length}개
            </div>
            {highlights.length === 0 ? (
              <div
                data-testid="median-compare-none"
                className="rounded-lg bg-muted/50 px-3 py-3 text-xs text-muted-foreground"
              >
                😌 평소와 비슷해요 · 유난히 많거나 적은 카테고리가 없어요
              </div>
            ) : (
              <>
                <ul data-testid="median-compare-highlights" className="divide-y divide-border">
                  {visible.map((item) => (
                    <HighlightRow
                      key={item.category}
                      item={item}
                      group={group}
                      color={colorOf?.(item.category) ?? NEUTRAL_CATEGORY_COLOR}
                    />
                  ))}
                </ul>
                {hiddenCount > 0 ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAll(true)}
                    data-testid="median-compare-more"
                    className="h-7 w-full text-xs text-muted-foreground"
                  >
                    {hiddenCount}개 더 보기
                  </Button>
                ) : null}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
