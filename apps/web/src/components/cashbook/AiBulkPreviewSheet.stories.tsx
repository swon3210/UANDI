import type { Meta, StoryObj } from '@storybook/react';
import { Timestamp } from 'firebase/firestore';
import { OverlayProvider } from 'overlay-kit';
import { Sheet } from '@uandi/ui';
import type { CashbookCategory } from '@/types';
import { AiBulkPreviewSheet } from './AiBulkPreviewSheet';
import type { ParsedEntryCardData } from './ParsedEntryCard';

const today = new Date().toISOString().split('T')[0];

const mockCategories: CashbookCategory[] = [
  {
    id: 'c1',
    coupleId: 'couple1',
    group: 'expense',
    subGroup: 'variable_common',
    name: '식비',
    icon: 'utensils',
    color: '#FF7043',
    isDefault: true,
    sortOrder: 0,
    createdAt: Timestamp.fromDate(new Date()),
  },
  {
    id: 'c2',
    coupleId: 'couple1',
    group: 'expense',
    subGroup: 'variable_common',
    name: '교통',
    icon: 'bus',
    color: '#42A5F5',
    isDefault: true,
    sortOrder: 1,
    createdAt: Timestamp.fromDate(new Date()),
  },
  {
    id: 'c3',
    coupleId: 'couple1',
    group: 'income',
    subGroup: 'regular_income',
    name: '정기급여',
    icon: 'wallet',
    color: '#4CAF86',
    isDefault: true,
    sortOrder: 0,
    createdAt: Timestamp.fromDate(new Date()),
  },
];

const threeEntries: ParsedEntryCardData[] = [
  {
    type: 'expense',
    amount: 9000,
    category: '식비',
    description: '김치찌개',
    date: today,
    confidence: 0.95,
  },
  {
    type: 'expense',
    amount: 15000,
    category: '교통',
    description: '택시',
    date: today,
    confidence: 0.9,
  },
  {
    type: 'income',
    amount: 3500000,
    category: '정기급여',
    description: '월급',
    date: today,
    confidence: 0.98,
  },
];

const mixedConfidence: ParsedEntryCardData[] = [
  {
    type: 'expense',
    amount: 9000,
    category: '식비',
    description: '김치찌개',
    date: today,
    confidence: 0.95,
  },
  {
    type: 'expense',
    amount: 15000,
    category: '기타',
    description: '알 수 없음',
    date: today,
    confidence: 0.35,
  },
  {
    type: 'expense',
    amount: 12000,
    category: '식비',
    description: '카페',
    date: today,
    confidence: 0.55,
  },
];

const oneEntry: ParsedEntryCardData[] = [threeEntries[0]];

const tenEntries: ParsedEntryCardData[] = Array.from({ length: 10 }, (_, i) => ({
  type: 'expense',
  amount: (i + 1) * 1000,
  category: i % 2 === 0 ? '식비' : '교통',
  description: `항목 ${i + 1}`,
  date: today,
  confidence: 0.8 + (i % 3) * 0.05,
}));

const meta: Meta<typeof AiBulkPreviewSheet> = {
  title: 'Cashbook/AiBulkPreviewSheet',
  component: AiBulkPreviewSheet,
  decorators: [
    (Story) => (
      <OverlayProvider>
        <Sheet open>
          <Story />
        </Sheet>
      </OverlayProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AiBulkPreviewSheet>;

const commonArgs = {
  categories: mockCategories,
  coupleId: 'couple-1',
  createdBy: 'user-1',
  onConfirm: (entries: unknown) => console.log('confirm', entries),
  onClose: () => console.log('close'),
};

export const ThreeEntries: Story = {
  args: {
    ...commonArgs,
    initialEntries: threeEntries,
  },
};

export const MixedConfidence: Story = {
  args: {
    ...commonArgs,
    initialEntries: mixedConfidence,
  },
};

export const SingleEntry: Story = {
  args: {
    ...commonArgs,
    initialEntries: oneEntry,
  },
};

export const TenEntries: Story = {
  args: {
    ...commonArgs,
    initialEntries: tenEntries,
  },
};

export const EmptyAfterRemoval: Story = {
  args: {
    ...commonArgs,
    initialEntries: [],
  },
};
