import type { Meta, StoryObj } from '@storybook/react';
import { Timestamp } from 'firebase/firestore';
import { OverlayProvider } from 'overlay-kit';
import { Sheet } from '@uandi/ui';
import type { CashbookCategory } from '@/types';
import { createDefaultFilterState } from '@/hooks/useCashbook';
import { CashbookFilterSheet } from './CashbookFilterSheet';

const ts = Timestamp.now();
const base: Omit<CashbookCategory, 'id' | 'name' | 'icon' | 'color' | 'group' | 'subGroup'> = {
  coupleId: 'couple-1',
  isDefault: true,
  sortOrder: 0,
  parentCategoryId: null,
  description: '',
  examples: [],
  createdAt: ts,
};

const categories: CashbookCategory[] = [
  { ...base, id: '1', group: 'expense', subGroup: 'variable_common', name: '식비', icon: 'bowl_food', color: '#D8635A', sortOrder: 0 },
  { ...base, id: '2', group: 'expense', subGroup: 'variable_personal', name: '교통', icon: 'bus', color: '#5AA1D8', sortOrder: 1 },
  { ...base, id: '3', group: 'expense', subGroup: 'fixed_expense', name: '월세', icon: 'house', color: '#A05ED8', sortOrder: 2 },
  { ...base, id: '4', group: 'expense', subGroup: 'fixed_expense', name: '보험', icon: 'shield_check', color: '#5ED8A0', sortOrder: 3 },
  { ...base, id: '5', group: 'income', subGroup: 'regular_income', name: '정기급여', icon: 'wallet', color: '#5AA1D8', sortOrder: 0 },
  { ...base, id: '6', group: 'flex', subGroup: 'joint_flex', name: '여행', icon: 'airplane', color: '#F0A05E', sortOrder: 0 },
];

const manyCategories: CashbookCategory[] = Array.from({ length: 15 }, (_, i) => ({
  ...base,
  id: `m${i}`,
  group: 'expense' as const,
  subGroup: 'variable_common' as const,
  name: ['식비', '교통', '쇼핑', '데이트', '취미', '간식', '문화', '뷰티', '병원', '학습', '여가', '선물', '경조사', '구독', '기부'][i],
  icon: 'bowl_food',
  color: '#D8635A',
  sortOrder: i,
}));

const meta: Meta<typeof CashbookFilterSheet> = {
  title: 'Cashbook/CashbookFilterSheet',
  component: CashbookFilterSheet,
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
type Story = StoryObj<typeof CashbookFilterSheet>;

const commonArgs = {
  categories,
  initial: createDefaultFilterState(),
  onApply: (next: unknown) => console.log('apply', next),
  onClose: () => console.log('close'),
};

export const Default: Story = {
  args: { ...commonArgs },
};

export const WithActiveFilters: Story = {
  args: {
    ...commonArgs,
    initial: {
      period: { mode: 'month', year: 2024, month: 0 },
      typeFilter: 'expense',
      selectedCategoryNames: ['식비', '교통'],
      keyword: '마트',
      sort: 'latest',
    },
  },
};

export const CustomRange: Story = {
  args: {
    ...commonArgs,
    initial: {
      period: { mode: 'custom', start: '2024-01-01', end: '2024-03-15' },
      typeFilter: 'all',
      selectedCategoryNames: [],
      keyword: '',
      sort: 'latest',
    },
  },
};

export const ManyCategories: Story = {
  args: {
    ...commonArgs,
    categories: manyCategories,
    initial: { ...createDefaultFilterState(), typeFilter: 'expense' },
  },
};

export const NoCategories: Story = {
  args: {
    ...commonArgs,
    categories: [],
  },
};
