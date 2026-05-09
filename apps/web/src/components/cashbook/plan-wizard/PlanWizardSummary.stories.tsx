import type { Meta, StoryObj } from '@storybook/react';
import { Timestamp } from 'firebase/firestore';
import { PlanWizardSummary } from './PlanWizardSummary';
import type { AnnualPlanItem } from '@/types';

const meta: Meta<typeof PlanWizardSummary> = {
  title: 'Cashbook/PlanWizard/Summary',
  component: PlanWizardSummary,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof PlanWizardSummary>;

const ts = Timestamp.now();

function makeItem(
  partial: Partial<AnnualPlanItem> & {
    id: string;
    group: AnnualPlanItem['group'];
    subGroup: AnnualPlanItem['subGroup'];
    monthlyAmounts: number[];
  }
): AnnualPlanItem {
  return {
    planId: 'p',
    coupleId: 'c',
    categoryId: partial.id,
    inputMode: 'irregular',
    baseMonthlyAmount: null,
    annualAmount: partial.monthlyAmounts.reduce((s, v) => s + v, 0),
    ownerUid: null,
    updatedAt: ts,
    ...partial,
  };
}

const sampleItems: AnnualPlanItem[] = [
  makeItem({
    id: 'i-1',
    group: 'income',
    subGroup: 'regular_income',
    monthlyAmounts: Array(12).fill(5_000_000),
    inputMode: 'regular',
    baseMonthlyAmount: 5_000_000,
  }),
  makeItem({
    id: 'i-2',
    group: 'income',
    subGroup: 'irregular_income',
    monthlyAmounts: [0, 0, 0, 0, 2_000_000, 0, 0, 0, 0, 0, 0, 3_000_000],
  }),
  makeItem({
    id: 'e-1',
    group: 'expense',
    subGroup: 'fixed_expense',
    monthlyAmounts: Array(12).fill(800_000),
    inputMode: 'regular',
    baseMonthlyAmount: 800_000,
  }),
  makeItem({
    id: 'e-2',
    group: 'expense',
    subGroup: 'variable_common',
    monthlyAmounts: Array(12).fill(1_200_000),
  }),
  makeItem({
    id: 'e-3',
    group: 'expense',
    subGroup: 'fixed_expense',
    monthlyAmounts: [500_000, 0, 0, 0, 0, 0, 0, 0, 500_000, 0, 0, 0],
  }),
  makeItem({
    id: 'f-1',
    group: 'flex',
    subGroup: 'joint_flex',
    monthlyAmounts: [0, 0, 0, 0, 1_500_000, 0, 0, 2_000_000, 0, 0, 0, 0],
  }),
  makeItem({
    id: 'f-2',
    group: 'flex',
    subGroup: 'personal_flex',
    monthlyAmounts: Array(12).fill(300_000),
  }),
];

export const Default: Story = {
  args: {
    year: 2026,
    items: sampleItems,
  },
};

export const Saving: Story = {
  args: {
    year: 2026,
    items: sampleItems,
    saving: true,
  },
};

export const Empty: Story = {
  args: {
    year: 2026,
    items: [],
  },
};
