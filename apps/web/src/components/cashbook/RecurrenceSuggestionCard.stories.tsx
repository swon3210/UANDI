import type { Meta, StoryObj } from '@storybook/react';
import { RecurrenceSuggestionCard } from './RecurrenceSuggestionCard';

const meta: Meta<typeof RecurrenceSuggestionCard> = {
  title: 'Cashbook/Cashflow/RecurrenceSuggestionCard',
  component: RecurrenceSuggestionCard,
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
type Story = StoryObj<typeof RecurrenceSuggestionCard>;

const noop = () => {};

export const AddExpense: Story = {
  args: {
    suggestion: {
      categoryId: 'cat-1',
      categoryName: '공과금',
      type: 'expense',
      kind: 'add',
      dayOfMonth: 15,
      amount: 80000,
      scheduleLabel: '매월 15일쯤',
    },
    onAccept: noop,
    onDismiss: noop,
  },
};

export const AddIncome: Story = {
  args: {
    suggestion: {
      categoryId: 'cat-2',
      categoryName: '부수입',
      type: 'income',
      kind: 'add',
      dayOfMonth: 10,
      amount: 250000,
      scheduleLabel: '매월 10일쯤',
    },
    onAccept: noop,
    onDismiss: noop,
  },
};

export const RemoveExpense: Story = {
  args: {
    suggestion: {
      categoryId: 'cat-3',
      categoryName: '월세',
      type: 'expense',
      kind: 'remove',
      dayOfMonth: 5,
      amount: 500000,
      scheduleLabel: '매월 5일',
    },
    onAccept: noop,
    onDismiss: noop,
  },
};

export const RemoveIncome: Story = {
  args: {
    suggestion: {
      categoryId: 'cat-4',
      categoryName: '정기급여',
      type: 'income',
      kind: 'remove',
      dayOfMonth: 25,
      amount: 3000000,
      scheduleLabel: '매월 25일',
    },
    onAccept: noop,
    onDismiss: noop,
  },
};

export const LongName: Story = {
  args: {
    suggestion: {
      categoryId: 'cat-5',
      categoryName: '아주 긴 카테고리 이름 예시',
      type: 'expense',
      kind: 'add',
      dayOfMonth: 28,
      amount: 1234000,
      scheduleLabel: '매월 28일쯤',
    },
    onAccept: noop,
    onDismiss: noop,
  },
};
