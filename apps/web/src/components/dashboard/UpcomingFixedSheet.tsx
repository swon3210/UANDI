'use client';

import dayjs from 'dayjs';
import { CalendarClock } from 'lucide-react';
import { cn, EmptyState, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@uandi/ui';
import { CategoryIcon } from '@/components/cashbook/CategoryIcon';
import type { CategoryGroup } from '@/types';
import { formatCurrency } from '@/utils/currency';
import { formatDay } from '@/utils/date';
import type { UpcomingFixedItem } from '@/utils/upcoming-fixed';

type Props = {
  /** 오늘 포함 이달 남은 예정 (발생일 오름차순) */
  items: UpcomingFixedItem[];
  /** 발생일이 지났는데 아직 기록하지 않은 항목 */
  overdue: UpcomingFixedItem[];
  /** 예정의 지평. 월간 탭은 이달, 연간 탭은 올해. 제목·빈 상태 문구에 쓴다 */
  horizon?: 'month' | 'year';
};

const HORIZON_LABEL: Record<'month' | 'year', string> = { month: '이달', year: '올해' };

const AMOUNT_COLOR: Record<CategoryGroup, string> = {
  expense: 'text-expense',
  income: 'text-income',
};

/** 발생일을 오늘 기준 상대 표현으로 ("오늘", "내일", "3일 후", "2일 지남") */
function relativeLabel(date: Date, today = dayjs()): string {
  const diff = dayjs(date).startOf('day').diff(today.startOf('day'), 'day');
  if (diff === 0) return '오늘';
  if (diff === 1) return '내일';
  if (diff > 1) return `${diff}일 후`;
  return `${-diff}일 지남`;
}

function ItemRow({ item }: { item: UpcomingFixedItem }) {
  return (
    <li
      className="flex items-center gap-3 py-2.5"
      data-testid={`upcoming-fixed-item-${item.category}`}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted"
        style={{ color: item.color || undefined }}
      >
        <CategoryIcon name={item.icon} size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{item.category}</div>
        <div className="text-xs text-muted-foreground">
          {formatDay(item.date)} · {relativeLabel(item.date)}
          {item.note ? ` · ${item.note}` : ''}
        </div>
      </div>
      <div className={cn('shrink-0 text-sm font-semibold tabular-nums', AMOUNT_COLOR[item.type])}>
        {formatCurrency(item.amount)}
      </div>
    </li>
  );
}

/**
 * 이달 예정 고정 지출·수입 목록 바텀시트.
 * 아직 기록하지 않은 지난 발생분을 위에, 남은 예정을 아래에 발생일 순으로 보여준다.
 * 보기 전용이다. 가계부에 실제로 기록하면 그 달 발생분은 예정에서 빠지므로 별도의 완료 처리는 없다.
 */
export function UpcomingFixedSheet({ items, overdue, horizon = 'month' }: Props) {
  const scope = HORIZON_LABEL[horizon];
  const isEmpty = items.length === 0 && overdue.length === 0;

  return (
    <SheetContent
      side="bottom"
      className="rounded-t-[20px] max-h-[90vh] overflow-y-auto"
      data-testid="upcoming-fixed-sheet"
    >
      <SheetHeader className="text-left">
        <SheetTitle>{scope} 예정 고정 수입·지출</SheetTitle>
        <SheetDescription>
          카테고리의 정기 발생 설정에서 가져왔어요. 가계부에 기록하면 예정에서 빠져요.
        </SheetDescription>
      </SheetHeader>

      {isEmpty ? (
        <div className="py-6">
          <EmptyState
            icon={<CalendarClock size={32} />}
            title={`${scope} 남은 예정이 없어요`}
            description="고정 지출·수입 카테고리에 정기 발생을 설정하면 여기에 보여요"
          />
        </div>
      ) : (
        <div className="space-y-4 py-2">
          {overdue.length > 0 ? (
            <section data-testid="upcoming-fixed-overdue">
              <h3 className="text-xs font-semibold text-muted-foreground">
                ⏰ 아직 기록하지 않았어요 {overdue.length}건
              </h3>
              <ul className="divide-y divide-border">
                {overdue.map((item) => (
                  <ItemRow key={`${item.categoryId}-${item.date.getTime()}`} item={item} />
                ))}
              </ul>
            </section>
          ) : null}

          {items.length > 0 ? (
            <section data-testid="upcoming-fixed-list">
              <h3 className="text-xs font-semibold text-muted-foreground">
                남은 예정 {items.length}건
              </h3>
              <ul className="divide-y divide-border">
                {items.map((item) => (
                  <ItemRow key={`${item.categoryId}-${item.date.getTime()}`} item={item} />
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </SheetContent>
  );
}
