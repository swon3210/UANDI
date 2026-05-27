import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { EntryFilter, type EntryFilterType } from './EntryFilter';
import type { CashbookCategory } from '@/types';

const ts = Timestamp.now();
const base: Omit<CashbookCategory, 'id' | 'name' | 'icon' | 'color' | 'group' | 'subGroup'> = {
  coupleId: 'couple-1',
  isDefault: true,
  sortOrder: 0,
  parentCategoryId: null,
  description: '',
  examples: [],
  createdAt: ts,
};

const categories: CashbookCategory[] = [
  {
    ...base,
    id: '1',
    group: 'expense',
    subGroup: 'variable_common',
    name: '식비',
    icon: 'bowl_food',
    color: '#D8635A',
    sortOrder: 0,
  },
  {
    ...base,
    id: '2',
    group: 'expense',
    subGroup: 'variable_personal',
    name: '교통',
    icon: 'bus',
    color: '#5AA1D8',
    sortOrder: 1,
  },
  {
    ...base,
    id: '3',
    group: 'expense',
    subGroup: 'fixed_expense',
    name: '월세',
    icon: 'house',
    color: '#A05ED8',
    sortOrder: 2,
  },
  {
    ...base,
    id: '4',
    group: 'expense',
    subGroup: 'fixed_expense',
    name: '보험',
    icon: 'shield_check',
    color: '#5ED8A0',
    sortOrder: 3,
  },
  {
    ...base,
    id: '5',
    group: 'income',
    subGroup: 'regular_income',
    name: '정기급여',
    icon: 'wallet',
    color: '#5AA1D8',
    sortOrder: 0,
  },
  {
    ...base,
    id: '6',
    group: 'income',
    subGroup: 'irregular_income',
    name: '인센티브',
    icon: 'trophy',
    color: '#D8A05E',
    sortOrder: 1,
  },
  {
    ...base,
    id: '7',
    group: 'flex',
    subGroup: 'joint_flex',
    name: '여행',
    icon: 'airplane',
    color: '#F0A05E',
    sortOrder: 0,
  },
  {
    ...base,
    id: '8',
    group: 'flex',
    subGroup: 'personal_flex',
    name: '소비',
    icon: 'shopping_bag',
    color: '#A0F05E',
    sortOrder: 1,
  },
];

const manyCategories: CashbookCategory[] = Array.from({ length: 15 }, (_, i) => ({
  ...base,
  id: `m${i}`,
  group: 'expense' as const,
  subGroup: 'variable_common' as const,
  name: [
    '식비',
    '교통',
    '쇼핑',
    '데이트',
    '취미',
    '간식',
    '문화',
    '뷰티',
    '병원',
    '학습',
    '여가',
    '선물',
    '경조사',
    '구독',
    '기부',
  ][i],
  icon: 'bowl_food',
  color: '#D8635A',
  sortOrder: i,
}));

const meta: Meta<typeof EntryFilter> = {
  title: 'Cashbook/EntryFilter',
  component: EntryFilter,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[360px] p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof EntryFilter>;

function Wrapper({
  initialType = 'all' as EntryFilterType,
  initialSelected = [] as string[],
  cats = categories,
}: {
  initialType?: EntryFilterType;
  initialSelected?: string[];
  cats?: CashbookCategory[];
}) {
  const [typeFilter, setTypeFilter] = useState<EntryFilterType>(initialType);
  const [selected, setSelected] = useState<string[]>(initialSelected);

  return (
    <EntryFilter
      categories={cats}
      typeFilter={typeFilter}
      selectedCategoryNames={selected}
      onTypeChange={(t) => {
        setTypeFilter(t);
        setSelected([]);
      }}
      onCategoryToggle={(name) => {
        setSelected((prev) =>
          prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
        );
      }}
      onReset={() => setSelected([])}
    />
  );
}

export const Default: Story = {
  render: () => <Wrapper />,
};

export const ExpenseTabWithSelection: Story = {
  render: () => <Wrapper initialType="expense" initialSelected={['식비', '교통']} />,
};

export const ManyCategories: Story = {
  render: () => <Wrapper initialType="expense" cats={manyCategories} />,
};

export const NoCategories: Story = {
  render: () => <Wrapper cats={[]} />,
};
