import type { Meta, StoryObj } from '@storybook/react';
import { CashflowBaselineCard } from './CashflowBaselineCard';
import type { CashflowMember } from '@/utils/cashflow';

const members: CashflowMember[] = [
  { uid: 'u1', displayName: '지훈', photoURL: null },
  { uid: 'u2', displayName: '서연', photoURL: null },
];

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

// 각자 오늘 잔액을 함께 보여준다(합계 230만 = 지훈 150만 + 서연 80만).
export const WithMemberBalances: Story = {
  args: {
    todayBalance: 2300000,
    initialCash: 2000000,
    members,
    balanceByUid: { u1: 1500000, u2: 800000 },
  },
};

// 한쪽 잔액이 음수(마이너스는 빨갛게).
export const OneNegative: Story = {
  args: {
    todayBalance: 400000,
    initialCash: 1000000,
    members,
    balanceByUid: { u1: 700000, u2: -300000 },
  },
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
