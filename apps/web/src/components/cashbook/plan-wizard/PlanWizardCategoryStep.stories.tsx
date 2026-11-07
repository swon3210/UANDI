import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { PlanWizardCategoryStep } from './PlanWizardCategoryStep';
import type { AnnualPlanItem, CashbookCategory } from '@/types';
import type { WizardPhase } from '@/hooks/usePlanWizard';
import type { WizardMode } from '@/constants/plan-wizard';

const meta: Meta<typeof PlanWizardCategoryStep> = {
  title: 'Cashbook/PlanWizard/CategoryStep',
  component: PlanWizardCategoryStep,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof PlanWizardCategoryStep>;

const ts = Timestamp.now();

const regularCategory: CashbookCategory = {
  id: 'cat-r',
  coupleId: 'c',
  group: 'income',
  subGroup: 'regular_income',
  name: '정기급여',
  icon: 'wallet',
  color: '#4CAF86',
  isDefault: true,
  sortOrder: 0,
  createdAt: ts,
};

const irregularCategory: CashbookCategory = {
  id: 'cat-i',
  coupleId: 'c',
  group: 'expense',
  subGroup: 'variable_common',
  name: '식비',
  icon: 'bowl_food',
  color: '#D8635A',
  isDefault: true,
  sortOrder: 0,
  createdAt: ts,
};

function Demo({
  category,
  initialItem,
  phase,
  mode,
}: {
  category: CashbookCategory;
  initialItem: AnnualPlanItem;
  phase: WizardPhase;
  mode?: WizardMode;
}) {
  const [item, setItem] = useState(initialItem);
  const isRegular =
    initialItem.subGroup === 'regular_income' || initialItem.subGroup === 'fixed_expense';
  return (
    <PlanWizardCategoryStep
      category={category}
      item={item}
      phase={phase}
      mode={mode}
      onChangeAvg={(v) =>
        setItem((prev) => ({
          ...prev,
          baseMonthlyAmount: isRegular ? v : null,
          monthlyAmounts: Array(12).fill(v),
          annualAmount: v * 12,
        }))
      }
      onChangeMonthly={(vals) =>
        setItem((prev) => ({
          ...prev,
          monthlyAmounts: vals,
          annualAmount: vals.reduce((s, x) => s + x, 0),
        }))
      }
    />
  );
}

const baseRegularItem: AnnualPlanItem = {
  id: 'item-r',
  planId: 'p',
  coupleId: 'c',
  categoryId: 'cat-r',
  group: 'income',
  subGroup: 'regular_income',
  monthlyAmounts: Array(12).fill(0),
  inputMode: 'regular',
  baseMonthlyAmount: 0,
  annualAmount: 0,
  ownerUid: null,
  updatedAt: ts,
};

const baseIrregularItem: AnnualPlanItem = {
  id: 'item-i',
  planId: 'p',
  coupleId: 'c',
  categoryId: 'cat-i',
  group: 'expense',
  subGroup: 'variable_common',
  monthlyAmounts: Array(12).fill(0),
  inputMode: 'irregular',
  baseMonthlyAmount: null,
  annualAmount: 0,
  ownerUid: null,
  updatedAt: ts,
};

export const RegularAvgPhase: Story = {
  render: () => <Demo category={regularCategory} initialItem={baseRegularItem} phase="avg" />,
};

export const RegularGridPhase: Story = {
  render: () => (
    <Demo
      category={regularCategory}
      initialItem={{
        ...baseRegularItem,
        baseMonthlyAmount: 3_500_000,
        monthlyAmounts: Array(12).fill(3_500_000),
        annualAmount: 42_000_000,
      }}
      phase="grid"
    />
  ),
};

export const Irregular: Story = {
  render: () => <Demo category={irregularCategory} initialItem={baseIrregularItem} phase="grid" />,
};

/** 빠른 모드 — 변동 공통 항목도 평균 1화면으로(안내·연간 합계 문구가 바뀐다) */
export const QuickVariableAvg: Story = {
  render: () => (
    <Demo category={irregularCategory} initialItem={baseIrregularItem} phase="avg" mode="quick" />
  ),
};

/** 수입 정기 항목 — 두 사람 합산 안내 */
export const RegularIncomeWithHint: Story = {
  render: () => <Demo category={regularCategory} initialItem={baseRegularItem} phase="avg" />,
};
