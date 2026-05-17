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

function cat(
  id: string,
  patch: Partial<CashbookCategory> & Pick<CashbookCategory, 'group' | 'subGroup' | 'name' | 'icon'>
): CashbookCategory {
  return {
    id,
    coupleId: 'c1',
    color: '#D8635A',
    isDefault: true,
    sortOrder: 0,
    parentCategoryId: null,
    description: '',
    examples: [],
    createdAt: ts,
    ...patch,
  };
}

const incomeCategories: CashbookCategory[] = [
  cat('1', { group: 'income', subGroup: 'regular_income', name: '정기급여', icon: 'wallet', color: '#4CAF86' }),
  cat('2', { group: 'income', subGroup: 'regular_income', name: '상여', icon: 'gift', color: '#4CAF86' }),
  cat('3', { group: 'income', subGroup: 'irregular_income', name: '인센티브', icon: 'trophy', color: '#63C39F' }),
  cat('4', { group: 'income', subGroup: 'irregular_income', name: '부업', icon: 'briefcase', color: '#63C39F' }),
];

const expenseCategories: CashbookCategory[] = [
  cat('5', { group: 'expense', subGroup: 'fixed_expense', name: '월세', icon: 'house' }),
  cat('6', { group: 'expense', subGroup: 'fixed_expense', name: '보험', icon: 'shield_check' }),
  cat('7', { group: 'expense', subGroup: 'variable_common', name: '식비', icon: 'bowl_food', description: '부부가 함께한 장보기·외식·배달' }),
  cat('8', { group: 'expense', subGroup: 'variable_personal', name: '교통', icon: 'bus' }),
];

const expenseWithChildren: CashbookCategory[] = [
  ...expenseCategories,
  cat('9', { group: 'expense', subGroup: 'variable_common', name: '외식', icon: 'fork_knife', parentCategoryId: '7', sortOrder: 0 }),
  cat('10', { group: 'expense', subGroup: 'variable_common', name: '장보기', icon: 'shopping_bag', parentCategoryId: '7', sortOrder: 1 }),
  cat('11', { group: 'expense', subGroup: 'variable_common', name: '디저트', icon: 'ice_cream', parentCategoryId: '7', sortOrder: 2 }),
];

const noop = () => {};

export const IncomeTab: Story = {
  args: {
    categories: incomeCategories,
    group: 'income',
    onEdit: noop,
    onDelete: noop,
    onAddChild: noop,
  },
};

export const ExpenseTab: Story = {
  args: {
    categories: expenseCategories,
    group: 'expense',
    onEdit: noop,
    onDelete: noop,
    onAddChild: noop,
  },
};

export const ExpenseWithChildren: Story = {
  args: {
    categories: expenseWithChildren,
    group: 'expense',
    onEdit: noop,
    onDelete: noop,
    onAddChild: noop,
  },
};

export const Empty: Story = {
  args: {
    categories: [],
    group: 'flex',
    onEdit: noop,
    onDelete: noop,
    onAddChild: noop,
  },
};
