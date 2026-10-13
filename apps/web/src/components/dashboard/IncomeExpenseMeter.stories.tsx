import type { Meta, StoryObj } from '@storybook/react';
import { IncomeExpenseMeter } from './IncomeExpenseMeter';

const meta: Meta<typeof IncomeExpenseMeter> = {
  title: 'Dashboard/IncomeExpenseMeter',
  component: IncomeExpenseMeter,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[360px] rounded-xl border border-border bg-card p-4">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof IncomeExpenseMeter>;

export const UnderIncome: Story = {
  args: { income: 3_200_000, expense: 2_100_000 },
};

export const NearlyFull: Story = {
  args: { income: 3_200_000, expense: 3_050_000 },
};

export const OverIncome: Story = {
  args: { income: 2_500_000, expense: 3_380_000 },
};

export const NoIncome: Story = {
  args: { income: 0, expense: 420_000 },
};

export const NoExpense: Story = {
  args: { income: 3_200_000, expense: 0 },
};

export const Empty: Story = {
  args: { income: 0, expense: 0 },
};
