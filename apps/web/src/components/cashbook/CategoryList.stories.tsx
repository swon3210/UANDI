import type { Meta, StoryObj } from '@storybook/react';
import { Timestamp } from 'firebase/firestore';
import { CategoryList } from './CategoryList';
import type { CashbookCategory } from '@/types';

const meta: Meta<typeof CategoryList> = {
  title: 'Cashbook/CategoryList',
  component: CategoryList,
};

export default meta;
type Story = StoryObj<typeof CategoryList>;

const ts = Timestamp.now();

const incomeCategories: CashbookCategory[] = [
  { id: '1', coupleId: 'c1', group: 'income', subGroup: 'regular_income', name: '정기급여', icon: 'wallet', color: '#4CAF86', isDefault: true, sortOrder: 0, createdAt: ts },
  { id: '2', coupleId: 'c1', group: 'income', subGroup: 'regular_income', name: '상여', icon: 'gift', color: '#4CAF86', isDefault: true, sortOrder: 1, createdAt: ts },
  { id: '3', coupleId: 'c1', group: 'income', subGroup: 'irregular_income', name: '인센티브', icon: 'trophy', color: '#63C39F', isDefault: true, sortOrder: 0, createdAt: ts },
  { id: '4', coupleId: 'c1', group: 'income', subGroup: 'irregular_income', name: '부업', icon: 'briefcase', color: '#63C39F', isDefault: true, sortOrder: 1, createdAt: ts },
];

const expenseCategories: CashbookCategory[] = [
  { id: '5', coupleId: 'c1', group: 'expense', subGroup: 'fixed_expense', name: '월세', icon: 'house', color: '#D8635A', isDefault: true, sortOrder: 0, createdAt: ts },
  { id: '6', coupleId: 'c1', group: 'expense', subGroup: 'fixed_expense', name: '보험', icon: 'shield_check', color: '#D8635A', isDefault: true, sortOrder: 1, createdAt: ts },
  { id: '7', coupleId: 'c1', group: 'expense', subGroup: 'variable_common', name: '식비', icon: 'bowl_food', color: '#D8635A', isDefault: true, sortOrder: 0, createdAt: ts },
  { id: '8', coupleId: 'c1', group: 'expense', subGroup: 'variable_personal', name: '교통', icon: 'bus', color: '#D8635A', isDefault: true, sortOrder: 0, createdAt: ts },
];

export const IncomeTab: Story = {
  args: {
    categories: incomeCategories,
    group: 'income',
    onEdit: () => {},
    onDelete: () => {},
  },
};

export const ExpenseTab: Story = {
  args: {
    categories: expenseCategories,
    group: 'expense',
    onEdit: () => {},
    onDelete: () => {},
  },
};

export const Empty: Story = {
  args: {
    categories: [],
    group: 'investment',
    onEdit: () => {},
    onDelete: () => {},
  },
};
