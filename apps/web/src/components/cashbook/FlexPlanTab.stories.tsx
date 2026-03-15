import type { Meta, StoryObj } from '@storybook/react';
import { Timestamp } from 'firebase/firestore';
import { FlexPlanTab } from './FlexPlanTab';
import type { AnnualPlanItem, CashbookCategory } from '@/types';

const meta: Meta<typeof FlexPlanTab> = {
  title: 'Cashbook/FlexPlanTab',
  component: FlexPlanTab,
};

export default meta;
type Story = StoryObj<typeof FlexPlanTab>;

const mockCategories: CashbookCategory[] = [
  {
    id: 'cat-1',
    coupleId: 'c1',
    group: 'flex',
    subGroup: 'joint_flex',
    name: '여행',
    icon: 'airplane',
    color: '#F0A05E',
    isDefault: true,
    sortOrder: 0,
    createdAt: Timestamp.now(),
  },
  {
    id: 'cat-2',
    coupleId: 'c1',
    group: 'flex',
    subGroup: 'joint_flex',
    name: '여가',
    icon: 'film_slate',
    color: '#F0A05E',
    isDefault: true,
    sortOrder: 1,
    createdAt: Timestamp.now(),
  },
  {
    id: 'cat-3',
    coupleId: 'c1',
    group: 'flex',
    subGroup: 'personal_flex',
    name: '소비',
    icon: 'shopping_bag',
    color: '#F0A05E',
    isDefault: true,
    sortOrder: 0,
    createdAt: Timestamp.now(),
  },
];

const mockItems: AnnualPlanItem[] = [
  {
    id: 'item-1',
    planId: 'plan-1',
    coupleId: 'c1',
    categoryId: 'cat-1',
    group: 'flex',
    subGroup: 'joint_flex',
    annualAmount: 2000000,
    monthlyAmount: null,
    targetMonths: null,
    ownerUid: null,
    updatedAt: Timestamp.now(),
  },
  {
    id: 'item-2',
    planId: 'plan-1',
    coupleId: 'c1',
    categoryId: 'cat-2',
    group: 'flex',
    subGroup: 'joint_flex',
    annualAmount: 500000,
    monthlyAmount: null,
    targetMonths: null,
    ownerUid: null,
    updatedAt: Timestamp.now(),
  },
  {
    id: 'item-3',
    planId: 'plan-1',
    coupleId: 'c1',
    categoryId: 'cat-3',
    group: 'flex',
    subGroup: 'personal_flex',
    annualAmount: 500000,
    monthlyAmount: null,
    targetMonths: null,
    ownerUid: 'user-1',
    updatedAt: Timestamp.now(),
  },
];

export const Default: Story = {
  args: {
    items: mockItems,
    categories: mockCategories,
    flexAvailable: 4000000,
    currentUserUid: 'user-1',
    partnerDisplayName: '연인',
    onItemAmountChange: () => {},
  },
};

export const Empty: Story = {
  args: {
    items: [],
    categories: mockCategories,
    flexAvailable: 4000000,
    currentUserUid: 'user-1',
    onItemAmountChange: () => {},
  },
};

export const ZeroAvailable: Story = {
  args: {
    items: mockItems,
    categories: mockCategories,
    flexAvailable: 0,
    currentUserUid: 'user-1',
    onItemAmountChange: () => {},
  },
};
