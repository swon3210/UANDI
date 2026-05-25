import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import type { CashbookCategory } from '@/types';
import { CategoryChips } from './CategoryChips';

const ts = Timestamp.fromDate(new Date());

const expenseCategories: CashbookCategory[] = [
  {
    id: 'p1',
    coupleId: 'c1',
    group: 'expense',
    subGroup: 'fixed_expense',
    name: '월세',
    icon: 'house',
    color: '#FF7043',
    isDefault: true,
    sortOrder: 0,
    parentCategoryId: null,
    description: '월 단위 고정 주거비',
    examples: ['월세', '관리비'],
    createdAt: ts,
  },
  {
    id: 'p2',
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
    id: 'p2-c1',
    coupleId: 'c1',
    group: 'expense',
    subGroup: 'variable_common',
    name: '장보기',
    icon: 'shopping_bag',
    color: '#FFA726',
    isDefault: false,
    sortOrder: 0,
    parentCategoryId: 'p2',
    description: '',
    examples: [],
    createdAt: ts,
  },
  {
    id: 'p2-c2',
    coupleId: 'c1',
    group: 'expense',
    subGroup: 'variable_common',
    name: '외식',
    icon: 'fork_knife',
    color: '#FFA726',
    isDefault: false,
    sortOrder: 1,
    parentCategoryId: 'p2',
    description: '',
    examples: ['치킨', '피자', '돈까스'],
    createdAt: ts,
  },
  {
    id: 'p3',
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
];

function Wrapper({
  categories,
  initialValue = '',
  hideAdd = false,
  hideHint = false,
}: {
  categories: CashbookCategory[];
  initialValue?: string;
  hideAdd?: boolean;
  hideHint?: boolean;
}) {
  const [value, setValue] = useState(initialValue);
  return (
    <CategoryChips
      categories={categories}
      activeType="expense"
      value={value}
      onChange={setValue}
      onAddCategory={() => console.log('add category')}
      hideAdd={hideAdd}
      hideHint={hideHint}
    />
  );
}

const meta: Meta<typeof Wrapper> = {
  title: 'Cashbook/CategoryChips',
  component: Wrapper,
  decorators: [
    (Story) => (
      <div className="max-w-md p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Wrapper>;

export const Default: Story = {
  args: {
    categories: expenseCategories,
  },
};

export const ParentSelected: Story = {
  args: {
    categories: expenseCategories,
    initialValue: '월세',
  },
};

export const ChildSelected: Story = {
  args: {
    categories: expenseCategories,
    initialValue: '외식',
  },
};

export const OrphanedValue: Story = {
  args: {
    categories: expenseCategories,
    initialValue: '옛 식비 카테고리',
  },
};

export const NoCategories: Story = {
  args: {
    categories: [],
  },
};

export const HideAddAndHint: Story = {
  args: {
    categories: expenseCategories,
    initialValue: '식비',
    hideAdd: true,
    hideHint: true,
  },
};
