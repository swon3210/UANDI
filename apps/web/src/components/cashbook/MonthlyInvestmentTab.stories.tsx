import type { Meta, StoryObj } from '@storybook/react';
import { Timestamp } from 'firebase/firestore';
import type { CashbookEntry } from '@/types';
import { MonthlyInvestmentTab } from './MonthlyInvestmentTab';

const meta: Meta<typeof MonthlyInvestmentTab> = {
  title: 'Cashbook/MonthlyInvestmentTab',
  component: MonthlyInvestmentTab,
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
type Story = StoryObj<typeof MonthlyInvestmentTab>;

const now = Timestamp.now();
const earlyMonth = Timestamp.fromDate(new Date(2026, 2, 5));
const midMonth = Timestamp.fromDate(new Date(2026, 2, 12));

const categories = [
  { id: 'cat-savings', name: '예적금', icon: 'piggy_bank', subGroup: 'cash_holding' },
  { id: 'cat-checking', name: '입출금', icon: 'credit_card', subGroup: 'cash_holding' },
  { id: 'cat-domestic', name: '국내주식', icon: 'chart_line_up', subGroup: 'investment' },
  { id: 'cat-foreign', name: '해외주식', icon: 'globe', subGroup: 'investment' },
];

export const WithData: Story = {
  args: {
    budgetItems: [
      {
        categoryId: 'cat-domestic',
        group: 'investment',
        subGroup: 'investment',
        budgetAmount: 750000,
        ownerUid: null,
      },
      {
        categoryId: 'cat-foreign',
        group: 'investment',
        subGroup: 'investment',
        budgetAmount: 750000,
        ownerUid: null,
      },
    ],
    entries: [
      {
        id: '1',
        coupleId: 'c1',
        createdBy: 'u1',
        type: 'investment',
        amount: 500000,
        category: '국내주식',
        description: '삼성전자 10주',
        date: earlyMonth,
        createdAt: now,
        transactionType: 'buy',
      },
      {
        id: '2',
        coupleId: 'c1',
        createdBy: 'u1',
        type: 'investment',
        amount: 52000,
        category: '국내주식',
        description: '매도 수익',
        date: midMonth,
        createdAt: now,
        transactionType: 'sell',
      },
      {
        id: '3',
        coupleId: 'c1',
        createdBy: 'u1',
        type: 'investment',
        amount: 700000,
        category: '해외주식',
        description: '',
        date: midMonth,
        createdAt: now,
        transactionType: 'buy',
      },
    ] as CashbookEntry[],
    cashBalances: [
      {
        id: 'b1',
        coupleId: 'c1',
        categoryId: 'cat-savings',
        year: 2026,
        month: 3,
        balance: 12000000,
        updatedAt: now,
      },
      {
        id: 'b2',
        coupleId: 'c1',
        categoryId: 'cat-checking',
        year: 2026,
        month: 3,
        balance: 3500000,
        updatedAt: now,
      },
    ],
    categories,
    onAddInvestment: () => {},
    onUpdateBalance: () => {},
  },
};

export const Empty: Story = {
  args: {
    budgetItems: [],
    entries: [],
    cashBalances: [],
    categories,
    onAddInvestment: () => {},
    onUpdateBalance: () => {},
  },
};
