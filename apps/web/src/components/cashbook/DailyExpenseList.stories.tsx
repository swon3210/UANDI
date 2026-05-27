import type { Meta, StoryObj } from '@storybook/react';
import dayjs from 'dayjs';
import { Timestamp } from 'firebase/firestore';
import { DailyExpenseList } from './DailyExpenseList';
import type { DailyExpense } from '@/hooks/useWeeklyBudget';
import type { CashbookEntry } from '@/types';

const meta: Meta<typeof DailyExpenseList> = {
  title: 'Cashbook/DailyExpenseList',
  component: DailyExpenseList,
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
type Story = StoryObj<typeof DailyExpenseList>;

function makeEntry(
  overrides: Partial<CashbookEntry> & { amount: number; category: string }
): CashbookEntry {
  return {
    id: `entry-${Math.random().toString(36).slice(2)}`,
    coupleId: 'couple-1',
    createdBy: 'user-1',
    type: 'expense',
    description: '',
    date: Timestamp.fromDate(new Date()),
    createdAt: Timestamp.fromDate(new Date()),
    ...overrides,
  };
}

const monday = dayjs('2026-03-16');

const sampleDays: DailyExpense[] = [
  {
    date: monday,
    dayOfWeek: '월',
    total: 85000,
    entries: [
      makeEntry({ amount: 35000, category: '식비', description: '점심 외식' }),
      makeEntry({ amount: 50000, category: '쇼핑', description: '마트 장보기' }),
    ],
    isFuture: false,
    isToday: false,
  },
  {
    date: monday.add(1, 'day'),
    dayOfWeek: '화',
    total: 42000,
    entries: [makeEntry({ amount: 42000, category: '식비' })],
    isFuture: false,
    isToday: false,
  },
  {
    date: monday.add(2, 'day'),
    dayOfWeek: '수',
    total: 120000,
    entries: [makeEntry({ amount: 120000, category: '데이트', description: '카페' })],
    isFuture: false,
    isToday: false,
  },
  {
    date: monday.add(3, 'day'),
    dayOfWeek: '목',
    total: 35000,
    entries: [makeEntry({ amount: 35000, category: '교통' })],
    isFuture: false,
    isToday: true,
  },
  {
    date: monday.add(4, 'day'),
    dayOfWeek: '금',
    total: 0,
    entries: [],
    isFuture: true,
    isToday: false,
  },
  {
    date: monday.add(5, 'day'),
    dayOfWeek: '토',
    total: 0,
    entries: [],
    isFuture: true,
    isToday: false,
  },
  {
    date: monday.add(6, 'day'),
    dayOfWeek: '일',
    total: 0,
    entries: [],
    isFuture: true,
    isToday: false,
  },
];

export const Default: Story = {
  args: {
    days: sampleDays,
    categories: [
      { name: '식비', icon: 'bowl_food' },
      { name: '쇼핑', icon: 'shopping_bag' },
      { name: '데이트', icon: 'heart' },
      { name: '교통', icon: 'bus' },
    ],
  },
};

export const AllEmpty: Story = {
  args: {
    days: sampleDays.map((d) => ({ ...d, total: 0, entries: [], isFuture: false, isToday: false })),
  },
};
