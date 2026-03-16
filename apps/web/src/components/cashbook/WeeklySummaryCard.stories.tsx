import type { Meta, StoryObj } from '@storybook/react';
import { WeeklySummaryCard } from './WeeklySummaryCard';

const meta: Meta<typeof WeeklySummaryCard> = {
  title: 'Cashbook/WeeklySummaryCard',
  component: WeeklySummaryCard,
  parameters: { layout: 'centered' },
  decorators: [(Story) => <div className="w-[400px]"><Story /></div>],
};

export default meta;
type Story = StoryObj<typeof WeeklySummaryCard>;

export const Stable: Story = {
  args: {
    budget: 750000,
    spent: 480000,
    remaining: 270000,
    percentage: 64,
    status: 'stable',
  },
};

export const Warning: Story = {
  args: {
    budget: 750000,
    spent: 680000,
    remaining: 70000,
    percentage: 91,
    status: 'warning',
  },
};

export const Danger: Story = {
  args: {
    budget: 750000,
    spent: 820000,
    remaining: -70000,
    percentage: 100,
    status: 'danger',
  },
};

export const Empty: Story = {
  args: {
    budget: 750000,
    spent: 0,
    remaining: 750000,
    percentage: 0,
    status: 'stable',
  },
};
