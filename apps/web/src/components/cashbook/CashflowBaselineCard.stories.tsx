import type { Meta, StoryObj } from '@storybook/react';
import { CashflowBaselineCard } from './CashflowBaselineCard';

const meta: Meta<typeof CashflowBaselineCard> = {
  title: 'Cashbook/CashflowBaselineCard',
  component: CashflowBaselineCard,
  args: {
    initialDate: new Date('2026-01-01T00:00:00'),
    onEdit: () => alert('최초 현금 설정 열기'),
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

// 최초 현금(200만) 이후 기록이 쌓여 오늘 잔액이 230만으로 계산된 상태.
export const Default: Story = {
  args: { todayBalance: 2300000, initialCash: 2000000 },
};

// 방금 설정해 아직 누적 거래가 없어 오늘 잔액 = 최초 현금.
export const JustSet: Story = {
  args: { todayBalance: 2000000, initialCash: 2000000 },
};

export const Zero: Story = {
  args: { todayBalance: 0, initialCash: 0 },
};

export const Large: Story = {
  args: { todayBalance: 128500000, initialCash: 120000000 },
};
