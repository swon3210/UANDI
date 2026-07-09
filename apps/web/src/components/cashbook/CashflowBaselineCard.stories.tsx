import type { Meta, StoryObj } from '@storybook/react';
import { CashflowBaselineCard } from './CashflowBaselineCard';

const meta: Meta<typeof CashflowBaselineCard> = {
  title: 'Cashbook/CashflowBaselineCard',
  component: CashflowBaselineCard,
  args: {
    onEdit: () => alert('시작 현금 설정 열기'),
  },
  decorators: [
    (Story) => (
      <div className="max-w-md p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CashflowBaselineCard>;

export const Default: Story = {
  args: { amount: 2000000 },
};

export const Zero: Story = {
  args: { amount: 0 },
};

export const Large: Story = {
  args: { amount: 128500000 },
};
