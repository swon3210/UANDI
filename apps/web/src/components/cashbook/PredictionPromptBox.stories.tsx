import type { Meta, StoryObj } from '@storybook/react';
import { PredictionPromptBox } from './PredictionPromptBox';

const meta: Meta<typeof PredictionPromptBox> = {
  title: 'Cashbook/Cashflow/PredictionPromptBox',
  component: PredictionPromptBox,
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
type Story = StoryObj<typeof PredictionPromptBox>;

const noop = () => {};

export const CalendarExpense: Story = {
  args: {
    prompt: {
      id: '1',
      type: 'expense',
      amount: 700000,
      category: '월세',
      description: '',
      source: 'calendar',
      date: new Date(2026, 5, 25),
    },
    onConfirm: noop,
    onReject: noop,
    onEdit: noop,
  },
};

export const CalendarIncome: Story = {
  args: {
    prompt: {
      id: '2',
      type: 'income',
      amount: 2000000,
      category: '상여',
      description: '여름 보너스',
      source: 'calendar',
      date: new Date(2026, 5, 25),
    },
    onConfirm: noop,
    onReject: noop,
    onEdit: noop,
  },
};

export const AutoDetected: Story = {
  args: {
    prompt: {
      id: '3',
      type: 'expense',
      amount: 89000,
      category: '보험',
      description: '실손보험',
      source: 'auto',
      date: new Date(2026, 5, 25),
      recurrenceLabel: '매월 25일',
    },
    onConfirm: noop,
    onReject: noop,
    onEdit: noop,
  },
};

export const RecurrenceIncome: Story = {
  args: {
    prompt: {
      id: 'recurrence-cat1-2026-06-25',
      kind: 'recurrence',
      type: 'income',
      amount: 3000000,
      category: '정기급여',
      description: '',
      source: 'calendar',
      date: new Date(2026, 5, 25),
      recurrenceLabel: '매월 25일',
    },
    onConfirm: noop,
    onEdit: noop,
  },
};

export const RecurrenceExpense: Story = {
  args: {
    prompt: {
      id: 'recurrence-cat2-2026-06-05',
      kind: 'recurrence',
      type: 'expense',
      amount: 500000,
      category: '월세',
      description: '',
      source: 'calendar',
      date: new Date(2026, 5, 5),
      recurrenceLabel: '매월 5일',
    },
    onConfirm: noop,
    onEdit: noop,
  },
};

export const LongText: Story = {
  args: {
    prompt: {
      id: '4',
      type: 'expense',
      amount: 1234000,
      category: '아주 긴 카테고리 이름',
      description: '메모도 아주 길게 들어가는 경우를 확인하기 위한 예시 텍스트',
      source: 'auto',
      date: new Date(2026, 5, 25),
      recurrenceLabel: '매월 25일',
    },
    onConfirm: noop,
    onReject: noop,
    onEdit: noop,
  },
};
