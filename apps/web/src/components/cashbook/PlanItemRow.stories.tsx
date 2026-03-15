import type { Meta, StoryObj } from '@storybook/react';
import { PlanItemRow } from './PlanItemRow';

const meta: Meta<typeof PlanItemRow> = {
  title: 'Cashbook/PlanItemRow',
  component: PlanItemRow,
};

export default meta;
type Story = StoryObj<typeof PlanItemRow>;

export const Monthly: Story = {
  args: {
    categoryName: '정기급여',
    categoryIcon: 'wallet',
    categoryColor: '#4CAF86',
    inputMode: 'monthly',
    amount: 3500000,
    onAmountChange: () => {},
  },
};

export const Annual: Story = {
  args: {
    categoryName: '인센티브',
    categoryIcon: 'trophy',
    categoryColor: '#63C39F',
    inputMode: 'annual',
    amount: 5000000,
    onAmountChange: () => {},
  },
};

export const TargetMonths: Story = {
  args: {
    categoryName: '명절 용돈',
    categoryIcon: 'envelope',
    categoryColor: '#D8635A',
    inputMode: 'target_months',
    amount: 1000000,
    targetMonths: [1, 9],
    onAmountChange: () => {},
    onTargetMonthsChange: () => {},
  },
};

export const TargetMonthsEmpty: Story = {
  args: {
    categoryName: '명절 용돈',
    categoryIcon: 'envelope',
    categoryColor: '#D8635A',
    inputMode: 'target_months',
    amount: 0,
    targetMonths: [],
    onAmountChange: () => {},
    onTargetMonthsChange: () => {},
  },
};

export const ZeroAmount: Story = {
  args: {
    categoryName: '월세',
    categoryIcon: 'house',
    categoryColor: '#D8635A',
    inputMode: 'monthly',
    amount: 0,
    onAmountChange: () => {},
  },
};
