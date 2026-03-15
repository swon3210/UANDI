import type { Meta, StoryObj } from '@storybook/react';
import { Timestamp } from 'firebase/firestore';
import { CategoryItem } from './CategoryItem';
import type { CashbookCategory } from '@/types';

const meta: Meta<typeof CategoryItem> = {
  title: 'Cashbook/CategoryItem',
  component: CategoryItem,
};

export default meta;
type Story = StoryObj<typeof CategoryItem>;

const mockCategory: CashbookCategory = {
  id: '1',
  coupleId: 'couple-1',
  group: 'income',
  subGroup: 'regular_income',
  name: '정기급여',
  icon: 'wallet',
  color: '#4CAF86',
  isDefault: true,
  sortOrder: 0,
  createdAt: Timestamp.now(),
};

export const Default: Story = {
  args: {
    category: mockCategory,
    onEdit: () => {},
    onDelete: () => {},
  },
};

export const ExpenseCategory: Story = {
  args: {
    category: {
      ...mockCategory,
      group: 'expense',
      subGroup: 'fixed_expense',
      name: '월세',
      icon: 'house',
      color: '#D8635A',
    },
    onEdit: () => {},
    onDelete: () => {},
  },
};

export const LongName: Story = {
  args: {
    category: {
      ...mockCategory,
      name: '아주 긴 카테고리 이름 테스트',
    },
    onEdit: () => {},
    onDelete: () => {},
  },
};
