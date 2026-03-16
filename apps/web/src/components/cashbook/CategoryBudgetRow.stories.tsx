import type { Meta, StoryObj } from '@storybook/react';
import { CategoryBudgetRow } from './CategoryBudgetRow';

const meta: Meta<typeof CategoryBudgetRow> = {
  title: 'Cashbook/CategoryBudgetRow',
  component: CategoryBudgetRow,
  parameters: { layout: 'centered' },
  decorators: [(Story) => <div className="w-[400px]"><Story /></div>],
};

export default meta;
type Story = StoryObj<typeof CategoryBudgetRow>;

export const Stable: Story = {
  args: {
    categoryName: '식비',
    icon: 'bowl_food',
    budgetAmount: 600000,
    actualAmount: 390000,
    percentage: 65,
    status: 'stable',
    margin: 210000,
  },
};

export const Warning: Story = {
  args: {
    categoryName: '사회생활',
    icon: 'handshake',
    budgetAmount: 200000,
    actualAmount: 170000,
    percentage: 85,
    status: 'warning',
    margin: 30000,
  },
};

export const Danger: Story = {
  args: {
    categoryName: '교통',
    icon: 'bus',
    budgetAmount: 100000,
    actualAmount: 130000,
    percentage: 100,
    status: 'danger',
    margin: -30000,
  },
};

export const Complete: Story = {
  args: {
    categoryName: '월세',
    icon: 'house',
    budgetAmount: 800000,
    actualAmount: 800000,
    percentage: 100,
    status: 'stable',
    margin: 0,
  },
};
