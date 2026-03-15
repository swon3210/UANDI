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

export const AddIncome: Story = {
  args: {
    group: 'income',
    onSubmit: (data) => console.log('submit', data),
    onClose: () => {},
  },
};

export const AddExpense: Story = {
  args: {
    group: 'expense',
    onSubmit: (data) => console.log('submit', data),
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
      createdAt: Timestamp.now(),
    } as CashbookCategory,
    onSubmit: (data) => console.log('submit', data),
    onClose: () => {},
  },
};

export const InvestmentGroup: Story = {
  args: {
    group: 'investment',
    onSubmit: (data) => console.log('submit', data),
    onClose: () => {},
  },
};

export const FlexGroup: Story = {
  args: {
    group: 'flex',
    onSubmit: (data) => console.log('submit', data),
    onClose: () => {},
  },
};
