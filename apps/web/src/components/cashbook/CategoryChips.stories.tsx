import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import type { CashbookCategory } from '@/types';
import { SUB_GROUP_LABELS } from '@/constants/default-categories';
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

// 카테고리가 많을 때 드릴다운 + 검색이 스크롤을 어떻게 줄이는지 확인하기 위한 데이터.
const manyCategories: CashbookCategory[] = (() => {
  const subGroups = ['fixed_expense', 'variable_common', 'variable_personal'] as const;
  const out: CashbookCategory[] = [];
  let n = 0;
  for (const sg of subGroups) {
    for (let p = 0; p < 6; p++) {
      const parentId = `m-${sg}-${p}`;
      out.push({
        id: parentId,
        coupleId: 'c1',
        group: 'expense',
        subGroup: sg,
        name: `${SUB_GROUP_LABELS[sg]}${p + 1}`,
        icon: 'tag',
        color: '#FFA726',
        isDefault: false,
        sortOrder: p,
        parentCategoryId: null,
        description: '',
        examples: [],
        createdAt: ts,
      });
      // 일부 부모에만 자식을 둔다.
      if (p % 2 === 0) {
        for (let c = 0; c < 4; c++) {
          out.push({
            id: `${parentId}-c${c}`,
            coupleId: 'c1',
            group: 'expense',
            subGroup: sg,
            name: `세부${(n += 1)}`,
            icon: 'tag',
            color: '#FFA726',
            isDefault: false,
            sortOrder: c,
            parentCategoryId: parentId,
            description: '',
            examples: [],
            createdAt: ts,
          });
        }
      }
    }
  }
  return out;
})();

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

// 카테고리가 많을 때: 검색창 + 대분류만 가로 wrap, 자식은 드릴다운으로 노출되어 스크롤이 짧다.
export const ManyCategories: Story = {
  args: {
    categories: manyCategories,
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
