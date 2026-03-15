import type { Meta, StoryObj } from '@storybook/react';
import { AnnualSummaryCard } from './AnnualSummaryCard';

const meta: Meta<typeof AnnualSummaryCard> = {
  title: 'Cashbook/AnnualSummaryCard',
  component: AnnualSummaryCard,
};

export default meta;
type Story = StoryObj<typeof AnnualSummaryCard>;

export const Default: Story = {
  args: {
    totalIncome: 54000000,
    totalExpense: 36000000,
    investmentAllocated: 14000000,
    flexTotal: 4000000,
  },
};

export const Zero: Story = {
  args: {
    totalIncome: 0,
    totalExpense: 0,
    investmentAllocated: 0,
    flexTotal: 0,
  },
};

export const HighIncome: Story = {
  args: {
    totalIncome: 120000000,
    totalExpense: 48000000,
    investmentAllocated: 50000000,
    flexTotal: 22000000,
  },
};
