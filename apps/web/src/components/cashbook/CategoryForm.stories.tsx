import type { Meta, StoryObj } from '@storybook/react';
import { Timestamp } from 'firebase/firestore';
import { Sheet } from '@uandi/ui';
import { CategoryForm } from './CategoryForm';
import type { CashbookCategory } from '@/types';

const meta: Meta<typeof CategoryForm> = {
  title: 'Cashbook/CategoryForm',
  component: CategoryForm,
  decorators: [
    (Story) => (
      <Sheet open>
        <Story />
      </Sheet>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CategoryForm>;

const ts = Timestamp.now();

const sikbiParent: CashbookCategory = {
  id: 'p-sikbi',
  coupleId: 'c1',
  group: 'expense',
  subGroup: 'variable_common',
  name: '식비',
  icon: 'bowl_food',
  color: '#D8635A',
  isDefault: true,
  sortOrder: 0,
  parentCategoryId: null,
  description: '부부가 함께한 장보기·외식·배달',
  examples: ['장보기', '외식', '배달'],
  createdAt: ts,
};

const noop = async () => {};

export const AddIncome: Story = {
  args: {
    group: 'income',
    onSubmit: noop,
    onClose: () => {},
  },
};

export const AddExpense: Story = {
  args: {
    group: 'expense',
    onSubmit: noop,
    onClose: () => {},
  },
};

export const AddChildCategory: Story = {
  args: {
    group: 'expense',
    parentCategory: sikbiParent,
    onSubmit: noop,
    onClose: () => {},
  },
};

export const EditCategory: Story = {
  args: {
    group: 'income',
    editingCategory: {
      id: '1',
      coupleId: 'c1',
      group: 'income',
      subGroup: 'regular_income',
      name: '정기급여',
      icon: 'wallet',
      color: '#4CAF86',
      isDefault: true,
      sortOrder: 0,
      parentCategoryId: null,
      description: '매달 고정으로 들어오는 급여',
      examples: ['월급'],
      createdAt: ts,
    },
    onSubmit: noop,
    onClose: () => {},
  },
};

export const FlexGroup: Story = {
  args: {
    group: 'flex',
    onSubmit: noop,
    onClose: () => {},
  },
};
