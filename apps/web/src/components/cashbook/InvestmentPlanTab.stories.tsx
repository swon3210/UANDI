import type { Meta, StoryObj } from '@storybook/react';
import { Timestamp } from 'firebase/firestore';
import { InvestmentPlanTab } from './InvestmentPlanTab';
import type { AnnualPlanItem, CashbookCategory } from '@/types';

const meta: Meta<typeof InvestmentPlanTab> = {
  title: 'Cashbook/InvestmentPlanTab',
  component: InvestmentPlanTab,
};

export default meta;
type Story = StoryObj<typeof InvestmentPlanTab>;

const mockCategories: CashbookCategory[] = [
  {
    id: 'cat-1',
    coupleId: 'c1',
    group: 'investment',
    subGroup: 'cash_holding',
    name: '예적금',
    icon: 'piggy_bank',
    color: '#5B8DEF',
    isDefault: true,
    sortOrder: 0,
    createdAt: Timestamp.now(),
  },
  {
    id: 'cat-2',
    coupleId: 'c1',
    group: 'investment',
    subGroup: 'investment',
    name: '국내주식',
    icon: 'chart_line_up',
    color: '#5B8DEF',
    isDefault: true,
    sortOrder: 0,
    createdAt: Timestamp.now(),
  },
  {
    id: 'cat-3',
    coupleId: 'c1',
    group: 'investment',
    subGroup: 'investment',
    name: '해외주식',
    icon: 'globe',
    color: '#5B8DEF',
    isDefault: true,
    sortOrder: 1,
    createdAt: Timestamp.now(),
  },
];

const mockItems: AnnualPlanItem[] = [
  {
    id: 'item-1',
    planId: 'plan-1',
    coupleId: 'c1',
    categoryId: 'cat-1',
    group: 'investment',
    subGroup: 'cash_holding',
    annualAmount: 6000000,
    monthlyAmount: null,
    targetMonths: null,
    ownerUid: null,
    updatedAt: Timestamp.now(),
  },
  {
    id: 'item-2',
    planId: 'plan-1',
    coupleId: 'c1',
    categoryId: 'cat-2',
    group: 'investment',
    subGroup: 'investment',
    annualAmount: 4000000,
    monthlyAmount: null,
    targetMonths: null,
    ownerUid: null,
    updatedAt: Timestamp.now(),
  },
  {
    id: 'item-3',
    planId: 'plan-1',
    coupleId: 'c1',
    categoryId: 'cat-3',
    group: 'investment',
    subGroup: 'investment',
    annualAmount: 4000000,
    monthlyAmount: null,
    targetMonths: null,
    ownerUid: null,
    updatedAt: Timestamp.now(),
  },
];

export const Default: Story = {
  args: {
    items: mockItems,
    categories: mockCategories,
    totalIncome: 54000000,
    totalExpense: 36000000,
    targetReturnRate: 3,
    onTargetReturnRateChange: () => {},
    onItemAmountChange: () => {},
  },
};

export const OverBudget: Story = {
  args: {
    items: mockItems.map((item) => ({ ...item, annualAmount: 10000000 })),
    categories: mockCategories,
    totalIncome: 20000000,
    totalExpense: 15000000,
    targetReturnRate: 5,
    onTargetReturnRateChange: () => {},
    onItemAmountChange: () => {},
  },
};

export const Empty: Story = {
  args: {
    items: [],
    categories: mockCategories,
    totalIncome: 54000000,
    totalExpense: 36000000,
    targetReturnRate: 0,
    onTargetReturnRateChange: () => {},
    onItemAmountChange: () => {},
  },
};
