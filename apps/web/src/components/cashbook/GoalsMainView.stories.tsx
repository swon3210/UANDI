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

const sampleItems: AnnualPlanItem[] = [
  {
    id: '1',
    planId: 'p',
    coupleId: 'c',
    categoryId: 'salary',
    group: 'income',
    subGroup: 'regular_income',
    annualAmount: 60000000,
    monthlyAmount: 5000000,
    targetMonths: null,
    ownerUid: null,
    updatedAt: ts,
  },
  {
    id: '2',
    planId: 'p',
    coupleId: 'c',
    categoryId: 'bonus',
    group: 'income',
    subGroup: 'irregular_income',
    annualAmount: 60000000,
    monthlyAmount: null,
    targetMonths: null,
    ownerUid: null,
    updatedAt: ts,
  },
  {
    id: '3',
    planId: 'p',
    coupleId: 'c',
    categoryId: 'rent',
    group: 'expense',
    subGroup: 'fixed_expense',
    annualAmount: 9600000,
    monthlyAmount: 800000,
    targetMonths: null,
    ownerUid: null,
    updatedAt: ts,
  },
  {
    id: '4',
    planId: 'p',
    coupleId: 'c',
    categoryId: 'food',
    group: 'expense',
    subGroup: 'variable_common',
    annualAmount: 14400000,
    monthlyAmount: 1200000,
    targetMonths: null,
    ownerUid: null,
    updatedAt: ts,
  },
  {
    id: '5',
    planId: 'p',
    coupleId: 'c',
    categoryId: 'savings',
    group: 'investment',
    subGroup: 'cash_holding',
    annualAmount: 12000000,
    monthlyAmount: null,
    targetMonths: null,
    ownerUid: null,
    updatedAt: ts,
  },
  {
    id: '6',
    planId: 'p',
    coupleId: 'c',
    categoryId: 'stocks',
    group: 'investment',
    subGroup: 'investment',
    annualAmount: 18000000,
    monthlyAmount: null,
    targetMonths: null,
    ownerUid: null,
    updatedAt: ts,
  },
  {
    id: '7',
    planId: 'p',
    coupleId: 'c',
    categoryId: 'travel',
    group: 'flex',
    subGroup: 'joint_flex',
    annualAmount: 4000000,
    monthlyAmount: null,
    targetMonths: null,
    ownerUid: null,
    updatedAt: ts,
  },
  {
    id: '8',
    planId: 'p',
    coupleId: 'c',
    categoryId: 'leisure',
    group: 'flex',
    subGroup: 'personal_flex',
    annualAmount: 2000000,
    monthlyAmount: null,
    targetMonths: null,
    ownerUid: null,
    updatedAt: ts,
  },
];

export const Default: Story = {
  args: {
    items: sampleItems,
    actuals: {
      income: 50000000,
      expense: 12000000,
      investment: 0,
      flex: 1500000,
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
