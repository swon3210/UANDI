'use client';

import { Cell, Pie, PieChart } from 'recharts';
import { ChevronRight, PieChart as PieChartIcon } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  EmptyState,
  type ChartConfig,
} from '@uandi/ui';
import type { CategorySlice } from '@/hooks/useDashboardData';
import { formatCurrencyMan } from '@/utils/currency';

type Props = {
  data: CategorySlice[];
  /** 눌러서 하위로 펼칠 수 있는 슬라이스 이름 */
  expandable?: ReadonlySet<string>;
  onSelect?: (name: string) => void;
};

export function CategoryDonutChart({ data, expandable, onSelect }: Props) {
  const canExpand = (name: string) => Boolean(onSelect && expandable?.has(name));
  const total = data.reduce((sum, d) => sum + d.amount, 0);

  if (data.length === 0 || total === 0) {
    return (
      <div data-testid="category-donut">
        <EmptyState
          icon={<PieChartIcon size={32} />}
          title="카테고리 내역이 없어요"
          description="다른 그룹을 선택하거나 기간을 바꿔보세요"
        />
      </div>
    );
  }

  const config = data.reduce<ChartConfig>((acc, slice) => {
    acc[slice.category] = { label: slice.category, color: slice.color };
    return acc;
  }, {});

  return (
    <div data-testid="category-donut" className="flex flex-col gap-3">
      <ChartContainer config={config} className="mx-auto aspect-square h-[180px] w-[180px]">
        <PieChart>
          <ChartTooltip
            content={
              <ChartTooltipContent
                hideLabel
                formatter={(value, name) => {
                  const amount = typeof value === 'number' ? value : 0;
                  const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
                  return (
                    <span className="font-mono tabular-nums">
                      {String(name)} {pct}%
                    </span>
                  );
                }}
              />
            }
          />
          <Pie
            data={data}
            dataKey="amount"
            nameKey="category"
            innerRadius={50}
            outerRadius={80}
            strokeWidth={2}
            onClick={(_sector, index) => {
              const name = data[index]?.category;
              if (name && canExpand(name)) onSelect?.(name);
            }}
          >
            {data.map((slice) => (
              <Cell
                key={slice.category}
                fill={slice.color}
                className={canExpand(slice.category) ? 'cursor-pointer' : undefined}
              />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>

      <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
        {data.map((slice) => {
          const content = (
            <>
              <span
                data-testid={`category-donut-swatch-${slice.category}`}
                className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                style={{ backgroundColor: slice.color }}
              />
              <span className="truncate text-muted-foreground">{slice.category}</span>
              <span className="ml-auto font-mono tabular-nums">
                {formatCurrencyMan(slice.amount, { manDecimals: 1 })}원
              </span>
            </>
          );
          return (
            <li key={slice.category} data-testid={`category-donut-item-${slice.category}`}>
              {canExpand(slice.category) ? (
                // 하위가 있는 상위 카테고리: 눌러서 하위 비율로 펼친다
                <button
                  type="button"
                  onClick={() => onSelect?.(slice.category)}
                  aria-label={`${slice.category} 하위 카테고리 보기`}
                  className="-mx-1 flex w-[calc(100%+0.5rem)] items-center gap-1.5 rounded px-1 text-left hover:bg-accent"
                >
                  {content}
                  <ChevronRight size={12} className="shrink-0 text-muted-foreground" />
                </button>
              ) : (
                <div className="flex items-center gap-1.5">{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
