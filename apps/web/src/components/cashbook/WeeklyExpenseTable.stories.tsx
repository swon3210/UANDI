import type { Meta, StoryObj } from '@storybook/react';
import { WeeklyExpenseTable } from './WeeklyExpenseTable';

const meta: Meta<typeof WeeklyExpenseTable> = {
  title: 'Cashbook/WeeklyExpenseTable',
  component: WeeklyExpenseTable,
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
type Story = StoryObj<typeof WeeklyExpenseTable>;

export const Default: Story = {
  args: {
    weeks: [
      { week: 1, budget: 750000, actual: 680000, status: 'stable' },
      { week: 2, budget: 750000, actual: 820000, status: 'danger' },
      { week: 3, budget: 750000, actual: 360000, status: 'stable' },
      { week: 4, budget: 750000, actual: 0, status: 'future' },
    ],
  },
};

export const AllComplete: Story = {
  args: {
    weeks: [
      { week: 1, budget: 500000, actual: 450000, status: 'stable' },
      { week: 2, budget: 500000, actual: 520000, status: 'danger' },
      { week: 3, budget: 500000, actual: 490000, status: 'warning' },
      { week: 4, budget: 500000, actual: 380000, status: 'stable' },
      { week: 5, budget: 500000, actual: 200000, status: 'stable' },
    ],
  },
};
