import type { Meta, StoryObj } from '@storybook/react';
import { ParsedEntryCard } from './ParsedEntryCard';

const meta: Meta<typeof ParsedEntryCard> = {
  title: 'Cashbook/ParsedEntryCard',
  component: ParsedEntryCard,
  decorators: [
    (Story) => (
      <div className="max-w-md p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ParsedEntryCard>;

const today = new Date().toISOString().split('T')[0];

export const ExpenseHighConfidence: Story = {
  args: {
    entry: {
      type: 'expense',
      amount: 9000,
      category: '식비',
      description: '김치찌개',
      date: today,
      confidence: 0.95,
    },
    onClick: () => console.log('clicked'),
    onRemove: () => console.log('removed'),
  },
};

export const IncomeHighConfidence: Story = {
  args: {
    entry: {
      type: 'income',
      amount: 3500000,
      category: '정기급여',
      description: '월급',
      date: today,
      confidence: 0.98,
    },
    onClick: () => console.log('clicked'),
    onRemove: () => console.log('removed'),
  },
};

export const LowConfidence: Story = {
  args: {
    entry: {
      type: 'expense',
      amount: 15000,
      category: '기타',
      description: '알 수 없는 지출',
      date: today,
      confidence: 0.4,
    },
    onClick: () => console.log('clicked'),
    onRemove: () => console.log('removed'),
  },
};

export const EmptyDescription: Story = {
  args: {
    entry: {
      type: 'expense',
      amount: 15000,
      category: '교통',
      description: '',
      date: today,
      confidence: 0.85,
    },
    onClick: () => console.log('clicked'),
    onRemove: () => console.log('removed'),
  },
};

export const LongCategoryAndDescription: Story = {
  args: {
    entry: {
      type: 'expense',
      amount: 250000,
      category: '아주 긴 카테고리 이름 예시',
      description: '아주아주 긴 설명 텍스트가 한 줄에 다 들어가지 않는 경우를 확인하기 위한 예시입니다',
      date: today,
      confidence: 0.9,
    },
    onClick: () => console.log('clicked'),
    onRemove: () => console.log('removed'),
  },
};
