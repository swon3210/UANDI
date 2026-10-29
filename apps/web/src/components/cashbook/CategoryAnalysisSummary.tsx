'use client';

import { ChevronRight } from 'lucide-react';
import { Button, cn } from '@uandi/ui';
import type { CategoryGroup } from '@/types';
import { formatCurrency } from '@/utils/currency';

export type AnalysisCategoryChip = {
  name: string;
  color: string;
};

type Props = {
  /** 분석 범위 이름 (예: 선택한 카테고리 2개, 전체 변동 지출) */
  title: string;
  /** 고른 카테고리 칩. 비어 있으면(범위 전체) 칩 없이 제목만 */
  categories: AnalysisCategoryChip[];
  group: CategoryGroup;
  /** 기준 달 라벨 (예: 2026년 10월) */
  monthLabel: string;
  currentAmount: number;
  /** 비교 대상 라벨 (예: 평소, 2026년 9월) */
  compareLabel: string;
  /** 비교 대상 보조 설명 (예: 최근 5개월 중위값) */
  compareHint?: string;
  /** 비교 대상 합계. null이면 `—`와 함께 안내 */
  compareAmount: number | null;
  /** 비교 금액이 없을 때 안내 문구 */
  unavailableMessage?: string;
  /** 분석할 카테고리를 다시 고르는 시트를 연다. 없으면 버튼을 숨긴다 */
  onSelectCategories?: () => void;
};

const GROUP_LABEL: Record<CategoryGroup, string> = { expense: '지출', income: '수입' };
const GROUP_TONE: Record<CategoryGroup, string> = {
  expense: 'text-expense',
  income: 'text-income',
};
// 증가가 좋은 그룹(수입)과 나쁜 그룹(지출)을 나눠 증감 색을 정한다 (기간 비교와 같은 규칙)
const INCREASE_IS_GOOD: Record<CategoryGroup, boolean> = { expense: false, income: true };

function Delta({
  current,
  compare,
  compareLabel,
  group,
}: {
  current: number;
  compare: number;
  compareLabel: string;
  group: CategoryGroup;
}) {
  const delta = current - compare;
  if (delta === 0) {
    return <span className="text-muted-foreground">{compareLabel} 대비 변동 없음</span>;
  }
  const good = delta > 0 === INCREASE_IS_GOOD[group];
  const rate = compare !== 0 ? Math.round((Math.abs(delta) / Math.abs(compare)) * 100) : null;
  return (
    <>
      <span>{good ? '😎' : '🚨'} </span>
      <span className="text-muted-foreground">{compareLabel} 대비 </span>
      <span className={cn('font-extrabold tabular-nums', good ? 'text-income' : 'text-expense')}>
        {delta > 0 ? '▲' : '▼'} {formatCurrency(Math.abs(delta))}
        {rate !== null ? ` (${rate}%)` : ''}
      </span>
    </>
  );
}

/** AI 분석 페이지 상단: 분석 범위(칩)·기준 달 + 이번 달/비교 대상 두 칸 + 증감 한 줄 */
export function CategoryAnalysisSummary({
  title,
  categories,
  group,
  monthLabel,
  currentAmount,
  compareLabel,
  compareHint,
  compareAmount,
  unavailableMessage,
  onSelectCategories,
}: Props) {
  return (
    <section data-testid="category-analysis-summary" className="space-y-3">
      <div>
        <div className="flex items-baseline justify-between gap-2">
          <h2 data-testid="category-analysis-title" className="truncate text-xl font-semibold">
            {title}
          </h2>
          <span className="shrink-0 text-xs text-muted-foreground">{GROUP_LABEL[group]}</span>
        </div>
        <p data-testid="category-analysis-month" className="mt-0.5 text-xs text-muted-foreground">
          {monthLabel} 기준
        </p>
        {categories.length > 0 || onSelectCategories ? (
          <div className="mt-2 flex items-start gap-2">
            <ul className="flex min-w-0 flex-1 flex-wrap gap-1.5">
              {categories.map((c) => (
                <li
                  key={c.name}
                  data-testid={`category-analysis-chip-${c.name}`}
                  className="flex max-w-full items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs"
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: c.color }}
                    aria-hidden
                  />
                  <span className="truncate">{c.name}</span>
                </li>
              ))}
            </ul>
            {onSelectCategories ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSelectCategories}
                data-testid="category-analysis-category-button"
                className="-mr-2 -mt-1 h-7 shrink-0 gap-0.5 px-2 text-xs"
              >
                카테고리 선택
                <ChevronRight size={14} />
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      <dl className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-muted/50 px-3 py-2">
          <dt className="text-[11px] text-muted-foreground">이번 달</dt>
          <dd
            data-testid="category-analysis-current"
            className={cn('mt-0.5 text-lg font-semibold tabular-nums', GROUP_TONE[group])}
          >
            {formatCurrency(currentAmount)}
          </dd>
        </div>
        <div className="rounded-lg bg-muted/50 px-3 py-2">
          <dt
            data-testid="category-analysis-compare-label"
            className="truncate text-[11px] text-muted-foreground"
          >
            {compareLabel}
            {compareHint ? ` · ${compareHint}` : ''}
          </dt>
          <dd
            data-testid="category-analysis-compare"
            className="mt-0.5 text-lg font-semibold tabular-nums"
          >
            {compareAmount !== null ? formatCurrency(compareAmount) : '—'}
          </dd>
        </div>
      </dl>
      {compareAmount !== null ? (
        <div
          data-testid="category-analysis-delta"
          className="rounded-lg bg-muted/50 px-3 py-2 text-sm font-semibold"
        >
          <Delta
            current={currentAmount}
            compare={compareAmount}
            compareLabel={compareLabel}
            group={group}
          />
        </div>
      ) : unavailableMessage ? (
        <p className="text-[11px] text-muted-foreground">{unavailableMessage}</p>
      ) : null}
    </section>
  );
}
