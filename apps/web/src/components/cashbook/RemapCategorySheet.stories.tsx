import type { Meta, StoryObj } from '@storybook/react';
import { Timestamp } from 'firebase/firestore';
import { OverlayProvider } from 'overlay-kit';
import { Sheet } from '@uandi/ui';
import type { CashbookCategory } from '@/types';
import { RemapCategorySheet } from './RemapCategorySheet';

const ts = Timestamp.fromDate(new Date());

const mockCategories: CashbookCategory[] = [
  {
    id: 'p1',
    coupleId: 'c1',
    group: 'expense',
    subGroup: 'variable_common',
    name: '식비',
    icon: 'bowl_food',
    color: '#FFA726',
    isDefault: true,
    sortOrder: 0,
    parentCategoryId: null,
    description: '장보기·외식·배달',
    examples: ['장보기', '외식'],
    createdAt: ts,
  },
  {
    id: 'p1-c1',
    coupleId: 'c1',
    group: 'expense',
    subGroup: 'variable_common',
    name: '외식',
    icon: 'fork_knife',
    color: '#FFA726',
    isDefault: false,
    sortOrder: 0,
    parentCategoryId: 'p1',
    description: '',
    examples: [],
    createdAt: ts,
  },
  {
    id: 'p2',
    coupleId: 'c1',
    group: 'expense',
    subGroup: 'variable_personal',
    name: '교통',
    icon: 'bus',
    color: '#42A5F5',
    isDefault: true,
    sortOrder: 0,
    parentCategoryId: null,
    description: '',
    examples: [],
    createdAt: ts,
  },
  {
    id: 'i1',
    coupleId: 'c1',
    group: 'income',
    subGroup: 'regular_income',
    name: '정기급여',
    icon: 'wallet',
    color: '#4CAF86',
    isDefault: true,
    sortOrder: 0,
    parentCategoryId: null,
    description: '',
    examples: [],
    createdAt: ts,
  },
];

const meta: Meta<typeof RemapCategorySheet> = {
  title: 'Cashbook/RemapCategorySheet',
  component: RemapCategorySheet,
  args: {
    categories: mockCategories,
    onConfirm: (name: string) => console.log('confirm', name),
    onClose: () => console.log('close'),
  },
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
type Story = StoryObj<typeof RemapCategorySheet>;

export const AllEntries: Story = {
  args: {
    fromName: '옛 식비',
    selectedEntryCount: 5,
    totalEntryCount: 5,
  },
};

export const PartialSelection: Story = {
  args: {
    fromName: '옛 식비',
    selectedEntryCount: 2,
    totalEntryCount: 5,
  },
};

export const SingleEntry: Story = {
  args: {
    fromName: '옛 잡지비',
    selectedEntryCount: 1,
    totalEntryCount: 1,
  },
};

export const Submitting: Story = {
  args: {
    fromName: '옛 식비',
    selectedEntryCount: 5,
    totalEntryCount: 5,
    isSubmitting: true,
  },
};
