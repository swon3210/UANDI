import type { Meta, StoryObj } from '@storybook/react';
import { Timestamp } from 'firebase/firestore';
import type { CashbookEntry } from '@/types';
import { OrphanGroupCard } from './OrphanGroupCard';

const today = new Date();
const dayAgo = (n: number) => Timestamp.fromDate(new Date(today.getTime() - n * 86400000));

function makeEntry(id: string, overrides: Partial<CashbookEntry> = {}): CashbookEntry {
  return {
    id,
    coupleId: 'c1',
    createdBy: 'u1',
    type: 'expense',
    amount: 10000,
    category: '옛 카테고리',
    description: '',
    date: dayAgo(0),
    createdAt: dayAgo(0),
    ...overrides,
  };
}

const meta: Meta<typeof OrphanGroupCard> = {
  title: 'Cashbook/OrphanGroupCard',
  component: OrphanGroupCard,
  args: {
    onRemap: (ids: string[]) => console.log('remap', ids),
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
type Story = StoryObj<typeof OrphanGroupCard>;

export const Single: Story = {
  args: {
    name: '옛 식비',
    entries: [makeEntry('e1', { amount: 9000, description: '김치찌개', date: dayAgo(0) })],
  },
};

export const Multiple: Story = {
  args: {
    name: '옛 식비',
    entries: [
      makeEntry('e1', { amount: 45000, description: '마트 장보기', date: dayAgo(0) }),
      makeEntry('e2', { amount: 28000, description: '외식', date: dayAgo(2) }),
      makeEntry('e3', { amount: 12000, description: '카페', date: dayAgo(4) }),
      makeEntry('e4', { amount: 6000, description: '편의점', date: dayAgo(5) }),
      makeEntry('e5', {
        amount: 35000,
        description: '아주 긴 설명 텍스트가 한 줄에 다 들어가지 않는 경우',
        date: dayAgo(7),
      }),
    ],
  },
};

export const LongName: Story = {
  args: {
    name: '아주 긴 옛 카테고리 이름 — 줄임 처리 확인용',
    entries: [
      makeEntry('e1', { amount: 12000, description: '항목', date: dayAgo(1) }),
      makeEntry('e2', { amount: 8000, description: '항목', date: dayAgo(3) }),
    ],
  },
};

export const NoDescription: Story = {
  args: {
    name: '옛 잡지비',
    entries: [
      makeEntry('e1', { amount: 5000, description: '', date: dayAgo(1) }),
      makeEntry('e2', { amount: 7000, description: '', date: dayAgo(2) }),
    ],
  },
};

export const IncomeType: Story = {
  args: {
    name: '옛 보너스',
    entries: [
      makeEntry('e1', {
        type: 'income',
        amount: 500000,
        description: '상반기 보너스',
        date: dayAgo(10),
      }),
    ],
  },
};
