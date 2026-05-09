'use client';

import { RegularAvgInput } from './RegularAvgInput';
import { RegularGridAdjust } from './RegularGridAdjust';
import { IrregularGridInput } from './IrregularGridInput';
import { REGULAR_SUBGROUPS } from '@/constants/plan-wizard';
import type { AnnualPlanItem, CashbookCategory } from '@/types';
import type { WizardPhase } from '@/hooks/usePlanWizard';

type PlanWizardCategoryStepProps = {
  category: CashbookCategory;
  item: AnnualPlanItem;
  phase: WizardPhase;
  onChangeAvg: (value: number) => void;
  onChangeMonthly: (values: number[]) => void;
};

export function PlanWizardCategoryStep({
  category,
  item,
  phase,
  onChangeAvg,
  onChangeMonthly,
}: PlanWizardCategoryStepProps) {
  const isRegular = REGULAR_SUBGROUPS.has(item.subGroup);

  if (isRegular && phase === 'avg') {
    return (
      <RegularAvgInput
        category={category}
        value={item.baseMonthlyAmount ?? 0}
        onChange={onChangeAvg}
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
