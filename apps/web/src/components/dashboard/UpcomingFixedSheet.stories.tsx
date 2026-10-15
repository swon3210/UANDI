import type { Meta, StoryObj } from '@storybook/react';
import dayjs from 'dayjs';
import { Sheet } from '@uandi/ui';
import type { UpcomingFixedItem } from '@/utils/upcoming-fixed';
import { UpcomingFixedSheet } from './UpcomingFixedSheet';

const meta: Meta<typeof UpcomingFixedSheet> = {
  title: 'Dashboard/UpcomingFixedSheet',
  component: UpcomingFixedSheet,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <Sheet open>
        <Story />
      </Sheet>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof UpcomingFixedSheet>;

const inDays = (n: number) => dayjs().add(n, 'day').startOf('day').toDate();

const item = (
  partial: Partial<UpcomingFixedItem> & Pick<UpcomingFixedItem, 'category' | 'amount' | 'date'>
): UpcomingFixedItem => ({
  categoryId: `cat-${partial.category}`,
  type: 'expense',
  note: '매월 25일',
  icon: 'house',
  color: '#D8635A',
  ...partial,
});

const upcoming: UpcomingFixedItem[] = [
  item({
    category: '정기급여',
    amount: 3_000_000,
    date: inDays(0),
    type: 'income',
    icon: 'wallet',
    color: '#4CAF86',
    note: '매월 25일',
  }),
  item({ category: '월세', amount: 800_000, date: inDays(1), note: '매월 26일' }),
  item({
    category: '보험',
    amount: 150_000,
    date: inDays(4),
    icon: 'shield_check',
    color: '#3B82F6',
    note: '둘째 주 수요일',
  }),
  item({
    category: '통신비',
    amount: 65_000,
    date: inDays(9),
    icon: 'phone',
    color: '#8B5CF6',
    note: '매월 말일',
  }),
];

export const Default: Story = {
  args: { items: upcoming, overdue: [] },
};

export const WithOverdue: Story = {
  args: {
    items: upcoming.slice(1),
    overdue: [
      item({ category: '주차비', amount: 50_000, date: inDays(-6), icon: 'car', note: '매월 5일' }),
      item({ category: '구독료', amount: 14_900, date: inDays(-2), icon: 'tv', note: '매월 10일' }),
    ],
  },
};

export const OverdueOnly: Story = {
  args: {
    items: [],
    overdue: [
      item({ category: '주차비', amount: 50_000, date: inDays(-6), icon: 'car', note: '매월 5일' }),
    ],
  },
};

export const LongNames: Story = {
  args: {
    items: [
      item({
        category: '아주아주 길어서 한 줄에 다 못 들어가는 카테고리 이름',
        amount: 1_234_567_890,
        date: inDays(2),
        note: '분기마다 마지막 주 금요일',
      }),
    ],
    overdue: [],
  },
};

export const Empty: Story = {
  args: { items: [], overdue: [] },
};
