import type { Meta, StoryObj } from '@storybook/react';
import { Timestamp } from 'firebase/firestore';
import { MonthlyIncomeTab } from './MonthlyIncomeTab';

const meta: Meta<typeof MonthlyIncomeTab> = {
  title: 'Cashbook/MonthlyIncomeTab',
  component: MonthlyIncomeTab,
  parameters: { layout: 'centered' },
  decorators: [(Story) => <div className="w-[400px]"><Story /></div>],
};

export default meta;
type Story = StoryObj<typeof MonthlyIncomeTab>;

const now = Timestamp.now();

const categories = [
  { id: 'cat-salary', name: '정기급여', icon: 'wallet', subGroup: 'regular_income' },
  { id: 'cat-bonus', name: '상여', icon: 'gift', subGroup: 'regular_income' },
  { id: 'cat-incentive', name: '인센티브', icon: 'trophy', subGroup: 'irregular_income' },
  { id: 'cat-side', name: '부업', icon: 'briefcase', subGroup: 'irregular_income' },
];

export const WithReflectedIncome: Story = {
  args: {
    budgetItems: [
      { categoryId: 'cat-salary', group: 'income', subGroup: 'regular_income', budgetAmount: 3500000, ownerUid: null },
      { categoryId: 'cat-bonus', group: 'income', subGroup: 'regular_income', budgetAmount: 1000000, ownerUid: null },
      { categoryId: 'cat-incentive', group: 'income', subGroup: 'irregular_income', budgetAmount: 500000, ownerUid: null },
      { categoryId: 'cat-side', group: 'income', subGroup: 'irregular_income', budgetAmount: 250000, ownerUid: null },
    ],
    entries: [
      { id: '1', coupleId: 'c1', createdBy: 'u1', type: 'income', amount: 3500000, category: '정기급여', description: '', date: now, createdAt: now },
      { id: '2', coupleId: 'c1', createdBy: 'u1', type: 'income', amount: 250000, category: '부업', description: '', date: now, createdAt: now },
    ],
    categories,
    onAddIrregularIncome: () => {},
  },
};

export const Empty: Story = {
  args: {
    budgetItems: [],
    entries: [],
    categories: [],
    onAddIrregularIncome: () => {},
  },
};
