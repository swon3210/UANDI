'use client';

import type { Dayjs } from 'dayjs';
import { Button, Separator } from '@uandi/ui';
import type { PeriodKind } from '@/utils/date';
import { MEDIAN_WINDOW_MONTHS } from '@/utils/median-comparison';
import { PeriodPicker } from './PeriodPicker';

type Props = {
  kind: PeriodKind;
  /** 지금 비교 대상: 'median' = 평소, Dayjs = 그 기간 */
  value: Dayjs | 'median';
  /** 평소를 고른 상태에서 기간 선택기가 처음 보여줄 기간 (보통 직전 기간) */
  defaultCursor: Dayjs;
  /** 미래 기간 비활성화 기준. 스토리 등에서 고정값 주입용 */
  today?: Dayjs;
  onSelectMedian: () => void;
  onSelectPeriod: (cursor: Dayjs) => void;
};

/**
 * 기간 비교의 비교 대상 선택: 월간 탭은 맨 위에 "평소"(최근 달 중위값)를 두고,
 * 그 아래에서 특정 기간을 고를 수 있다. 연간 탭은 기간 선택만.
 */
export function CompareTargetPicker({
  kind,
  value,
  defaultCursor,
  today,
  onSelectMedian,
  onSelectPeriod,
}: Props) {
  const isMedian = value === 'median';
  const picker = (
    <PeriodPicker
      kind={kind}
      value={isMedian ? defaultCursor : value}
      highlightValue={!isMedian}
      today={today}
      onSelect={onSelectPeriod}
    />
  );
  if (kind !== 'monthly') return picker;

  return (
    <div className="space-y-4">
      <Button
        variant={isMedian ? 'default' : 'outline'}
        onClick={onSelectMedian}
        data-testid="compare-target-median"
        aria-pressed={isMedian}
        className="h-auto w-full flex-col items-start gap-0.5 px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold">평소와 비교</span>
        <span
          className={
            isMedian ? 'text-xs text-primary-foreground/80' : 'text-xs text-muted-foreground'
          }
        >
          최근 {MEDIAN_WINDOW_MONTHS}개월 중위값
        </span>
      </Button>
      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-[11px] text-muted-foreground">또는 특정 달과 비교</span>
        <Separator className="flex-1" />
      </div>
      {picker}
    </div>
  );
}
