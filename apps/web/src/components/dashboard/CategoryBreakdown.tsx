'use client';

import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@uandi/ui';
import type { CategoryTreeSlice } from '@/hooks/useDashboardData';
import { formatCurrencyMan } from '@/utils/currency';
import { CategoryDonutChart } from './CategoryDonutChart';

type Props = {
  /** 상위 카테고리 기준 슬라이스 (하위는 children) */
  data: CategoryTreeSlice[];
};

/**
 * 카테고리 도넛. 기본은 상위 카테고리 기준으로 합쳐 보여주고,
 * 하위가 있는 상위를 누르면 그 상위 안의 하위 비율로 펼친다.
 * 기간·그룹이 바뀌면 부모가 key로 리셋해 다시 상위 화면으로 돌아온다.
 */
export function CategoryBreakdown({ data }: Props) {
  const [drilled, setDrilled] = useState<string | null>(null);
  const parent = drilled ? data.find((s) => s.category === drilled) : undefined;

  if (parent && parent.children.length > 0) {
    return (
      <div className="space-y-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDrilled(null)}
          data-testid="category-donut-back"
          className="-ml-2 h-7 gap-0.5 px-2 text-xs"
        >
          <ChevronLeft size={14} />
          <span className="font-semibold">{parent.category}</span>
          <span className="ml-1 tabular-nums text-muted-foreground">
            {formatCurrencyMan(parent.amount, { manDecimals: 1 })}원
          </span>
        </Button>
        <CategoryDonutChart data={parent.children} />
      </div>
    );
  }

  const expandable = new Set(data.filter((s) => s.children.length > 0).map((s) => s.category));
  return <CategoryDonutChart data={data} expandable={expandable} onSelect={setDrilled} />;
}
