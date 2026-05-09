import type { Meta, StoryObj } from '@storybook/react';
import { Timestamp } from 'firebase/firestore';
import { GoalsMainView } from './GoalsMainView';
import type { AnnualPlanItem } from '@/types';

const meta: Meta<typeof GoalsMainView> = {
  title: 'Cashbook/GoalsMainView',
  component: GoalsMainView,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof GoalsMainView>;

const ts = Timestamp.now();

function makeItem(
  partial: Partial<AnnualPlanItem> & {
    id: string;
    group: AnnualPlanItem['group'];
    subGroup: AnnualPlanItem['subGroup'];
    monthlyAmounts: number[];
  }
): AnnualPlanItem {
  const annualAmount = partial.monthlyAmounts.reduce((s, v) => s + v, 0);
  return {
    planId: 'p',
    coupleId: 'c',
    categoryId: partial.id,
    inputMode: 'regular',
    baseMonthlyAmount: partial.monthlyAmounts[0] ?? null,
    annualAmount,
    ownerUid: null,
    updatedAt: ts,
    ...partial,
  };
}

const sampleItems: AnnualPlanItem[] = [
  makeItem({
    id: '1',
    group: 'income',
    subGroup: 'regular_income',
    monthlyAmounts: Array(12).fill(5_000_000),
  }),
  makeItem({
    id: '2',
    group: 'income',
    subGroup: 'irregular_income',
    monthlyAmounts: [0, 0, 0, 0, 0, 5_000_000, 0, 0, 0, 0, 0, 5_000_000],
    inputMode: 'irregular',
  }),
  makeItem({
    id: '3',
    group: 'expense',
    subGroup: 'fixed_expense',
    monthlyAmounts: Array(12).fill(800_000),
  }),
  makeItem({
    id: '4',
    group: 'expense',
    subGroup: 'variable_common',
    monthlyAmounts: Array(12).fill(1_200_000),
  }),
  makeItem({
    id: '5',
    group: 'flex',
    subGroup: 'joint_flex',
    monthlyAmounts: Array(12).fill(330_000),
  }),
  makeItem({
    id: '6',
    group: 'flex',
    subGroup: 'personal_flex',
    monthlyAmounts: Array(12).fill(170_000),
  }),
];

export const Default: Story = {
  args: {
    items: sampleItems,
    actuals: {
      income: 50_000_000,
      expense: 12_000_000,
      flex: 1_500_000,
    },
    onSelectCategory: () => {},
  },
};

export const NoActuals: Story = {
  args: {
    items: sampleItems,
    onSelectCategory: () => {},
  },
};

export const EmptyPlan: Story = {
  args: {
    items: [],
    onSelectCategory: () => {},
  },
};
