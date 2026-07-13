import type { Meta, StoryObj } from '@storybook/react';
import { CashflowCard } from './CashflowCard';
import type { CashflowCardData, CashflowMember, CashflowTransaction } from '@/utils/cashflow';

const members: CashflowMember[] = [
  { uid: 'u1', displayName: '지훈', photoURL: null },
  { uid: 'u2', displayName: '서연', photoURL: null },
];

const sampleTxns: CashflowTransaction[] = [
  {
    id: 't1',
    kind: 'actual',
    type: 'income',
    amount: 3000000,
    category: '정기급여',
    description: '6월 월급',
    date: new Date(2026, 5, 25),
    ownerUid: 'u1',
  },
  {
    id: 't2',
    kind: 'predicted',
    type: 'expense',
    amount: 700000,
    category: '월세',
    description: '',
    date: new Date(2026, 5, 25),
    source: 'calendar',
  },
  {
    id: 't3',
    kind: 'predicted',
    type: 'expense',
    amount: 89000,
    category: '보험',
    description: '실손보험',
    date: new Date(2026, 5, 25),
    source: 'auto',
  },
];

function card(overrides: Partial<CashflowCardData> = {}): CashflowCardData {
  return {
    key: 'k',
    label: '신한카드 결제',
    subLabel: '6월 25일 (목)',
    paydayType: 'card',
    endDate: new Date(2026, 5, 25),
    inflow: 3000000,
    outflow: 789000,
    balance: 2211000,
    // 지훈: 급여(+300만) 귀속, 공동 예측(월세+보험 −78.9만)은 반반 분배.
    balanceByUid: { u1: 1805500, u2: 405500 },
    isNegative: false,
    transactions: sampleTxns,
    ...overrides,
  };
}

const meta: Meta<typeof CashflowCard> = {
  title: 'Cashbook/Cashflow/Card',
  component: CashflowCard,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[380px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CashflowCard>;

export const Positive: Story = {
  args: { card: card() },
};

/** 각자 예상 잔액 칩이 카드에 함께 표시된다(합계 = 각자 합). */
export const WithMemberBalances: Story = {
  args: { card: card(), members, defaultOpen: true },
};

export const Expanded: Story = {
  args: { card: card(), defaultOpen: true },
};

export const Negative: Story = {
  args: {
    card: card({
      balance: -350000,
      balanceByUid: { u1: 150000, u2: -500000 },
      isNegative: true,
      inflow: 0,
      outflow: 700000,
    }),
    members,
    defaultOpen: true,
  },
};

export const Empty: Story = {
  args: {
    card: card({
      inflow: 0,
      outflow: 0,
      balance: 1500000,
      balanceByUid: { u1: 800000, u2: 700000 },
      transactions: [],
    }),
    members,
    defaultOpen: true,
  },
};

export const WithLlmPredictions: Story = {
  args: {
    card: card({
      // LLM 예측(◇, source='llm')은 일반 예측처럼 거래 목록에 들어가 들어올/나갈/남는 돈에 반영된다.
      inflow: 3200000,
      outflow: 909000,
      balance: 2291000,
      balanceByUid: { u1: 1845500, u2: 445500 },
      transactions: [
        ...sampleTxns,
        {
          id: 'llm-외식-2026-06-24',
          kind: 'predicted',
          type: 'expense',
          amount: 120000,
          category: '외식',
          description: '최근 3개월 매월 외식 지출 반복',
          date: new Date(2026, 5, 24),
          source: 'llm',
        },
        {
          id: 'llm-부수입-2026-06-24',
          kind: 'predicted',
          type: 'income',
          amount: 200000,
          category: '부수입',
          description: '분기마다 들어온 부수입 패턴',
          date: new Date(2026, 5, 24),
          source: 'llm',
        },
      ],
    }),
    members,
    defaultOpen: true,
  },
};

export const RentType: Story = {
  args: {
    card: card({
      label: '월세',
      subLabel: '7월 5일 (일)',
      paydayType: 'rent',
      inflow: 0,
      outflow: 700000,
      balance: 1500000,
      balanceByUid: { u1: 1150000, u2: 350000 },
    }),
  },
};

export const LoanType: Story = {
  args: {
    card: card({
      label: '주담대 이자',
      subLabel: '7월 10일 (금)',
      paydayType: 'loan',
      inflow: 0,
      outflow: 450000,
      balance: 1050000,
      balanceByUid: { u1: 925000, u2: 125000 },
    }),
  },
};

export const WeeklyBucket: Story = {
  args: {
    card: card({
      label: '6월 7일 ~ 6월 13일',
      subLabel: undefined,
      paydayType: undefined,
      inflow: 0,
      outflow: 120000,
      balance: 1380000,
      balanceByUid: { u1: 1130000, u2: 250000 },
    }),
  },
};
