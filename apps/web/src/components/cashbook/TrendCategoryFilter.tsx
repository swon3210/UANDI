'use client';

import { Button, cn } from '@uandi/ui';

export type TrendCategoryOption = {
  name: string;
  color: string;
};

type Props = {
  options: TrendCategoryOption[];
  /** null = 묶음 전체 */
  value: string | null;
  onChange: (value: string | null) => void;
};

const ALL_LABEL = '전체';

/** 추이 차트 위 카테고리 필터: `전체`(묶음 합계) + 카테고리 하나씩. 넘치면 가로 스크롤 */
export function TrendCategoryFilter({ options, value, onChange }: Props) {
  const chip = (key: string | null, label: string, color?: string) => {
    const selected = value === key;
    return (
      <Button
        key={label}
        variant={selected ? 'default' : 'outline'}
        size="sm"
        onClick={() => onChange(key)}
        aria-pressed={selected}
        data-testid={`category-analysis-trend-filter-${label}`}
        className="h-7 shrink-0 gap-1 rounded-full px-2.5 text-xs"
      >
        {color ? (
          <span
            className={cn('h-2 w-2 shrink-0 rounded-full', selected && 'ring-1 ring-background')}
            style={{ backgroundColor: color }}
            aria-hidden
          />
        ) : null}
        <span className="max-w-[8rem] truncate">{label}</span>
      </Button>
    );
  };

  return (
    <div
      role="group"
      aria-label="추이 카테고리"
      className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none]"
    >
      {chip(null, ALL_LABEL)}
      {options.map((o) => chip(o.name, o.name, o.color))}
    </div>
  );
}
