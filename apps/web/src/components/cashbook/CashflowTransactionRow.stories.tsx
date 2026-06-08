import type { Meta, StoryObj } from '@storybook/react';
import { CashflowTransactionRow } from './CashflowTransactionRow';

const meta: Meta<typeof CashflowTransactionRow> = {
  title: 'Cashbook/Cashflow/TransactionRow',
  component: CashflowTransactionRow,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[360px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CashflowTransactionRow>;

export const ActualIncome: Story = {
  args: {
    txn: {
      id: '1',
      kind: 'actual',
      type: 'income',
      amount: 3000000,
      category: '정기급여',
      description: '6월 월급',
      date: new Date(2026, 5, 25),
    },
  },
};

export const ActualExpense: Story = {
  args: {
    txn: {
      id: '2',
      kind: 'actual',
      type: 'expense',
      amount: 720000,
      category: '월세',
      description: '',
      date: new Date(2026, 5, 25),
    },
  },
};

export const PredictedCalendar: Story = {
  args: {
    txn: {
      id: '3',
      kind: 'predicted',
      type: 'expense',
      amount: 700000,
      category: '월세',
      description: '',
      date: new Date(2026, 5, 25),
      source: 'calendar',
    },
  },
};

export const PredictedAuto: Story = {
  args: {
    txn: {
      id: '4',
      kind: 'predicted',
      type: 'expense',
      amount: 89000,
      category: '보험',
      description: '실손보험',
      date: new Date(2026, 5, 25),
      source: 'auto',
    },
  },
};
