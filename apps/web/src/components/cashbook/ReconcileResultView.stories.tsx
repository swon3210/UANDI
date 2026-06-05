import type { Meta, StoryObj } from '@storybook/react';
import { Timestamp } from 'firebase/firestore';
import { OverlayProvider } from 'overlay-kit';
import { Sheet } from '@uandi/ui';
import type { CashbookCategory } from '@/types';
import { ReconcileResultView, type ReconcileEntry } from './ReconcileResultView';

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
];

const missingEntry = (
  overrides: Partial<ReconcileEntry> = {}
): ReconcileEntry => ({
  type: 'expense',
  amount: 15000,
  category: '교통',
  description: '택시',
  date: today,
  confidence: 0.9,
  matched: false,
  matchedDate: null,
  ...overrides,
});

const matchedEntry = (
  overrides: Partial<ReconcileEntry> = {}
): ReconcileEntry => ({
  type: 'expense',
  amount: 9000,
  category: '식비',
  description: '김치찌개',
  date: today,
  confidence: 0.95,
  matched: true,
  matchedDate: today,
  ...overrides,
});

const meta: Meta<typeof ReconcileResultView> = {
  title: 'Cashbook/ReconcileResultView',
  component: ReconcileResultView,
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
type Story = StoryObj<typeof ReconcileResultView>;

const commonArgs = {
  categories: mockCategories,
  coupleId: 'couple-1',
  createdBy: 'user-1',
  onConfirm: (entries: unknown) => console.log('confirm', entries),
  onClose: () => console.log('close'),
};

/** 일부는 가계부에 있고, 일부는 누락된 일반적인 대조 결과 */
export const MissingAndMatched: Story = {
  args: {
    ...commonArgs,
    entries: [
      matchedEntry(),
      missingEntry(),
      missingEntry({ amount: 4500, category: '식비', description: '카페', confidence: 0.6 }),
    ],
  },
};

/** 영수증의 모든 항목이 누락된 경우 (빈 가계부) */
export const AllMissing: Story = {
  args: {
    ...commonArgs,
    entries: [
      missingEntry(),
      missingEntry({ amount: 9000, category: '식비', description: '김치찌개' }),
    ],
  },
};

/** 영수증의 모든 항목이 이미 기록된 경우 — 추가할 게 없음 */
export const AllMatched: Story = {
  args: {
    ...commonArgs,
    entries: [matchedEntry(), matchedEntry({ amount: 15000, category: '교통', description: '택시' })],
  },
};

/** 누락 1건만 있는 경우 */
export const SingleMissing: Story = {
  args: {
    ...commonArgs,
    entries: [missingEntry()],
  },
};
