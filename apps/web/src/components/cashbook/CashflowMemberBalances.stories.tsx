import type { Meta, StoryObj } from '@storybook/react';
import { CashflowMemberBalances } from './CashflowMemberBalances';
import type { CashflowMember } from '@/utils/cashflow';

const members: CashflowMember[] = [
  { uid: 'u1', displayName: '지훈', photoURL: null },
  { uid: 'u2', displayName: '서연', photoURL: null },
];

const meta: Meta<typeof CashflowMemberBalances> = {
  title: 'Cashbook/Cashflow/MemberBalances',
  component: CashflowMemberBalances,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[340px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CashflowMemberBalances>;

export const Default: Story = {
  args: { members, balanceByUid: { u1: 1500000, u2: 800000 } },
};

export const Dense: Story = {
  args: { members, balanceByUid: { u1: 1500000, u2: 800000 }, dense: true },
};

/** 한쪽이 음수면 빨갛게 강조된다. */
export const OneNegative: Story = {
  args: { members, balanceByUid: { u1: 700000, u2: -300000 } },
};

/** 멤버가 1명(미연결)이면 사람별 표기가 무의미해 아무것도 렌더하지 않는다. */
export const SingleMemberHidden: Story = {
  args: {
    members: [{ uid: 'u1', displayName: '지훈', photoURL: null }],
    balanceByUid: { u1: 1500000 },
  },
};
