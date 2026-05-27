import type { Meta, StoryObj } from '@storybook/react';
import { MonthlyOverview } from './MonthlyOverview';

const meta: Meta<typeof MonthlyOverview> = {
  title: 'Cashbook/MonthlyOverview',
  component: MonthlyOverview,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[400px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MonthlyOverview>;

export const Stable: Story = {
  args: {
    incomeBudget: 4500000,
    incomeActual: 3500000,
    expenseBudget: 3000000,
    expenseActual: 1860000,
    balance: 1640000,
    margin: 1140000,
    status: 'stable',
  },
};

export const Warning: Story = {
  args: {
    incomeBudget: 4500000,
    incomeActual: 3500000,
    expenseBudget: 3000000,
    expenseActual: 2700000,
    balance: 800000,
    margin: 300000,
    status: 'warning',
  },
};

export const Danger: Story = {
  args: {
    incomeBudget: 4500000,
    incomeActual: 3500000,
    expenseBudget: 3000000,
    expenseActual: 3500000,
    balance: 0,
    margin: -500000,
    status: 'danger',
  },
};

export const NoBudget: Story = {
  args: {
    incomeBudget: 0,
    incomeActual: 0,
    expenseBudget: 0,
    expenseActual: 0,
    balance: 0,
    margin: 0,
    status: 'stable',
  },
};
