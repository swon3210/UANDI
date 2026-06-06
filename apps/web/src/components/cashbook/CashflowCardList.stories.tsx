import type { Meta, StoryObj } from '@storybook/react';
import { CashflowCardList } from './CashflowCardList';
import type { CashflowCardData } from '@/utils/cashflow';

const cards: CashflowCardData[] = [
  {
    key: 'c1',
    label: '신한카드 결제',
    subLabel: '6월 25일 (목)',
    paydayType: 'card',
    endDate: new Date(2026, 5, 25),
    inflow: 3000000,
    outflow: 700000,
    balance: 2800000,
    isNegative: false,
    transactions: [
      {
        id: 't1',
        kind: 'actual',
        type: 'income',
        amount: 3000000,
        category: '정기급여',
        description: '',
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
    ],
  },
  {
    key: 'c2',
    label: '대출 이자',
    subLabel: '7월 10일 (금)',
    paydayType: 'loan',
    endDate: new Date(2026, 6, 10),
    inflow: 0,
    outflow: 450000,
    balance: 2350000,
    isNegative: false,
    transactions: [
      {
        id: 't3',
        kind: 'predicted',
        type: 'expense',
        amount: 450000,
        category: '금융비용',
        description: '주담대 이자',
        date: new Date(2026, 6, 10),
        source: 'auto',
      },
    ],
  },
  {
    key: 'c3',
    label: '신한카드 결제',
    subLabel: '7월 25일 (토)',
    paydayType: 'card',
    endDate: new Date(2026, 6, 25),
    inflow: 0,
    outflow: 2800000,
    balance: -450000,
    isNegative: true,
    transactions: [
      {
        id: 't4',
        kind: 'predicted',
        type: 'expense',
        amount: 2800000,
        category: '카드값',
        description: '',
        date: new Date(2026, 6, 25),
        source: 'calendar',
      },
    ],
  },
];

const meta: Meta<typeof CashflowCardList> = {
  title: 'Cashbook/Cashflow/CardList',
  component: CashflowCardList,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className="mx-auto w-[400px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CashflowCardList>;

export const Default: Story = {
  args: { cards },
};

export const WeeklyFallback: Story = {
  args: {
    cards: [
      {
        key: 'w0',
        label: '6월 7일 ~ 6월 13일',
        endDate: new Date(2026, 5, 13),
        inflow: 0,
        outflow: 120000,
        balance: 1380000,
        isNegative: false,
        transactions: [],
      },
      {
        key: 'w1',
        label: '6월 14일 ~ 6월 20일',
        endDate: new Date(2026, 5, 20),
        inflow: 0,
        outflow: 350000,
        balance: 1030000,
        isNegative: false,
        transactions: [],
      },
    ],
  },
};

export const Empty: Story = {
  args: { cards: [] },
};
