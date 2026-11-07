'use client';

import { RegularAvgInput } from './RegularAvgInput';
import { RegularGridAdjust } from './RegularGridAdjust';
import { IrregularGridInput } from './IrregularGridInput';
import { REGULAR_SUBGROUPS, type WizardMode } from '@/constants/plan-wizard';
import type { AnnualPlanItem, CashbookCategory } from '@/types';
import type { WizardPhase } from '@/hooks/usePlanWizard';

type PlanWizardCategoryStepProps = {
  category: CashbookCategory;
  item: AnnualPlanItem;
  phase: WizardPhase;
  /** quick이면 모든 항목이 평균 1화면(그리드 없음). 생략하면 full */
  mode?: WizardMode;
  onChangeAvg: (value: number) => void;
  onChangeMonthly: (values: number[]) => void;
};

/** 평균 입력 화면에 보여줄 값. 정기 항목은 baseMonthlyAmount, 그 외는 12개월이 같으면 그 값, 아니면 평균. */
export function avgValueOf(item: AnnualPlanItem): number {
  if (item.baseMonthlyAmount !== null && item.baseMonthlyAmount !== undefined) {
    return item.baseMonthlyAmount;
  }
  const months = item.monthlyAmounts ?? [];
  if (months.length === 0) return 0;
  const first = months[0];
  if (months.every((v) => v === first)) return first;
  return Math.round(months.reduce((s, v) => s + v, 0) / months.length);
}

/** 수입 정기 항목: 공동 가계부라 두 사람 합산이라는 걸 첫 입력에서 알려준다 */
function hintFor(item: AnnualPlanItem, mode: WizardMode): string | undefined {
  if (item.group === 'income' && item.subGroup === 'regular_income') {
    return '두 사람 수입을 합쳐 적어요';
  }
  if (mode === 'quick' && item.subGroup === 'variable_common') {
    return '함께 쓰는 지출의 한 달 평균이에요. 정확하지 않아도 괜찮아요';
  }
  return undefined;
}

export function PlanWizardCategoryStep({
  category,
  item,
  phase,
  mode = 'full',
  onChangeAvg,
  onChangeMonthly,
}: PlanWizardCategoryStepProps) {
  const isRegular = REGULAR_SUBGROUPS.has(item.subGroup);
  const isQuick = mode === 'quick';

  if (phase === 'avg' && (isRegular || isQuick)) {
    return (
      <RegularAvgInput
        category={category}
        value={avgValueOf(item)}
        onChange={onChangeAvg}
        caption={isRegular ? '정기 항목 · 월 평균' : '변동 항목 · 월 평균'}
        hint={hintFor(item, mode)}
        annualNote={isQuick ? '나중에 경제 목표에서 달마다 다르게 조정할 수 있어요.' : undefined}
      />
    );
  }

  if (isRegular && phase === 'grid') {
    return (
      <RegularGridAdjust
        category={category}
        baseAmount={item.baseMonthlyAmount ?? 0}
        monthlyAmounts={item.monthlyAmounts}
        onChange={onChangeMonthly}
      />
    );
  }

  return (
    <IrregularGridInput
      category={category}
      monthlyAmounts={item.monthlyAmounts}
      onChange={onChangeMonthly}
    />
  );
}
