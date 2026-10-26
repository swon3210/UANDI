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
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

const commonHandlers = {
  onClick: () => console.log('clicked'),
  onToggleSelected: (v: boolean) => console.log('toggle', v),
};

export const ExpenseHighConfidence: Story = {
  args: {
    ...commonHandlers,
    entry: {
      type: 'expense',
      amount: 9000,
      category: '식비',
      description: '김치찌개',
      date: today,
      confidence: 0.95,
      selected: true,
    },
  },
};

export const IncomeHighConfidence: Story = {
  args: {
    ...commonHandlers,
    entry: {
      type: 'income',
      amount: 3500000,
      category: '정기급여',
      description: '월급',
      date: today,
      confidence: 0.98,
      selected: true,
    },
  },
};

export const LowConfidence: Story = {
  args: {
    ...commonHandlers,
    entry: {
      type: 'expense',
      amount: 15000,
      category: '기타',
      description: '알 수 없는 지출',
      date: today,
      confidence: 0.4,
      selected: true,
    },
  },
};

export const EmptyDescription: Story = {
  args: {
    ...commonHandlers,
    entry: {
      type: 'expense',
      amount: 15000,
      category: '교통',
      description: '',
      date: today,
      confidence: 0.85,
      selected: true,
    },
  },
};

export const LongCategoryAndDescription: Story = {
  args: {
    ...commonHandlers,
    entry: {
      type: 'expense',
      amount: 250000,
      category: '아주 긴 카테고리 이름 예시',
      description:
        '아주아주 긴 설명 텍스트가 한 줄에 다 들어가지 않는 경우를 확인하기 위한 예시입니다',
      date: today,
      confidence: 0.9,
      selected: true,
    },
  },
};

export const DuplicateUnselected: Story = {
  args: {
    ...commonHandlers,
    entry: {
      type: 'expense',
      amount: 5500,
      category: '식비',
      description: '스타벅스 아메리카노',
      date: today,
      confidence: 0.92,
      duplicate: { existingId: 'entry-1', existingDate: today },
      selected: false,
    },
  },
};

export const DuplicateAdjacentDate: Story = {
  args: {
    ...commonHandlers,
    entry: {
      type: 'expense',
      amount: 12000,
      category: '교통',
      description: '택시비',
      date: today,
      confidence: 0.88,
      duplicate: { existingId: 'entry-2', existingDate: yesterday },
      selected: false,
    },
  },
};

export const DuplicateButReSelected: Story = {
  args: {
    ...commonHandlers,
    entry: {
      type: 'expense',
      amount: 5500,
      category: '식비',
      description: '스타벅스 아메리카노 (오후)',
      date: today,
      confidence: 0.92,
      duplicate: { existingId: 'entry-1', existingDate: today },
      selected: true,
    },
  },
};

/** AI가 기존 카테고리에 맞추지 못해 사용자가 직접 골라야 하는 항목 */
export const NeedsCategory: Story = {
  args: {
    ...commonHandlers,
    entry: {
      type: 'expense',
      amount: 55000,
      category: '',
      description: 'SKT 휴대폰 요금',
      date: today,
      confidence: 0.9,
      duplicate: null,
      selected: true,
      needsCategory: true,
    },
  },
};

/** 쿠팡 결제내역 캡처와 매칭돼 품목이 설명에 붙은 항목 */
export const MatchedWithOrderDetails: Story = {
  args: {
    ...commonHandlers,
    entry: {
      type: 'expense',
      amount: 32000,
      category: '식비',
      description: '쿠팡(쿠페이) · 생수 2L 12개',
      date: today,
      confidence: 0.9,
      duplicate: null,
      selected: true,
    },
  },
};
