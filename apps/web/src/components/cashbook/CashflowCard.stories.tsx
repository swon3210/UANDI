import type { Meta, StoryObj } from '@storybook/react';
import { CashflowCard } from './CashflowCard';
import type { CashflowCardData, CashflowTransaction } from '@/utils/cashflow';

const sampleTxns: CashflowTransaction[] = [
  {
    id: 't1',
    kind: 'actual',
    type: 'income',
    amount: 3000000,
    category: '정기급여',
    description: '6월 월급',
    date: new Date(2026, 5, 25),
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

export const Expanded: Story = {
  args: { card: card(), defaultOpen: true },
};

export const Negative: Story = {
  args: {
    card: card({ balance: -350000, isNegative: true, inflow: 0, outflow: 700000 }),
    defaultOpen: true,
  },
};

export const WithEstimatedVariable: Story = {
  args: {
    card: card({ estimatedVariable: 420000 }),
    defaultOpen: true,
  },
};

export const Empty: Story = {
  args: {
    card: card({
      inflow: 0,
      outflow: 0,
      balance: 1500000,
      transactions: [],
    }),
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
    defaultOpen: true,
  },
};

export const RentType: Story = {
  args: {
    card: card({ label: '월세', subLabel: '7월 5일 (일)', paydayType: 'rent', inflow: 0, outflow: 700000, balance: 1500000 }),
  },
};

export const LoanType: Story = {
  args: {
    card: card({ label: '주담대 이자', subLabel: '7월 10일 (금)', paydayType: 'loan', inflow: 0, outflow: 450000, balance: 1050000 }),
  },
};

export const WeeklyBucket: Story = {
  args: {
    card: card({ label: '6월 7일 ~ 6월 13일', subLabel: undefined, paydayType: undefined, inflow: 0, outflow: 120000, balance: 1380000 }),
  },
};
