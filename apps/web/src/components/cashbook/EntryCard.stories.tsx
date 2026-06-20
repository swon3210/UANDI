import type { Meta, StoryObj } from '@storybook/react';
import { Timestamp } from 'firebase/firestore';
import type { CashbookEntry, CashbookCategory } from '@/types';
import { EntryCard } from './EntryCard';

const now = Timestamp.fromDate(new Date('2026-06-20T12:00:00'));

function makeEntry(overrides: Partial<CashbookEntry> = {}): CashbookEntry {
  return {
    id: 'e1',
    coupleId: 'c1',
    createdBy: 'u1',
    type: 'expense',
    amount: 12000,
    category: '식비',
    description: '점심 김치찌개',
    date: now,
    createdAt: now,
    ...overrides,
  };
}

const foodCategory: CashbookCategory = {
  id: 'cat-food',
  coupleId: 'c1',
  group: 'expense',
  subGroup: 'variable_common',
  name: '식비',
  icon: 'utensils',
  color: '#FF7043',
  isDefault: true,
  sortOrder: 0,
  parentCategoryId: null,
  description: '',
  examples: [],
  createdAt: now,
};

const meta: Meta<typeof EntryCard> = {
  title: 'Cashbook/EntryCard',
  component: EntryCard,
  args: {
    onClick: () => console.log('clicked'),
    category: foodCategory,
  },
  decorators: [
    (Story) => (
      <div className="max-w-md p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof EntryCard>;

export const WithAuthorPhoto: Story = {
  args: {
    entry: makeEntry(),
    author: { displayName: '지수', photoURL: 'https://i.pravatar.cc/100?img=5' },
  },
};

export const WithAuthorInitial: Story = {
  args: {
    entry: makeEntry({ description: '저녁 외식' }),
    author: { displayName: '현우', photoURL: null },
  },
};

export const IncomeWithAuthor: Story = {
  args: {
    entry: makeEntry({
      type: 'income',
      amount: 3500000,
      category: '급여',
      description: '월급',
    }),
    author: { displayName: '지수', photoURL: null },
  },
};

/** author 미전달 시 아바타 없이 기존 레이아웃 그대로. */
export const WithoutAuthor: Story = {
  args: {
    entry: makeEntry(),
  },
};

export const NoDescriptionWithAuthor: Story = {
  args: {
    entry: makeEntry({ description: '' }),
    author: { displayName: '현우', photoURL: null },
  },
};

export const ShowDateWithAuthor: Story = {
  args: {
    entry: makeEntry(),
    showDate: true,
    author: { displayName: '지수', photoURL: null },
  },
};
