import type { Meta, StoryObj } from '@storybook/react';
import { Timestamp } from 'firebase/firestore';
import { Sheet } from '@uandi/ui';
import type { CashbookCategory } from '@/types';
import { CategoryFilterSheet } from './CategoryFilterSheet';

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

// 대분류만 있는 플랫 세트(기본 시드와 유사).
const flat: CashbookCategory[] = [
  { ...base, id: 'e1', group: 'expense', subGroup: 'fixed_expense', name: '월세', icon: 'house', color: '#D8635A', sortOrder: 0 },
  { ...base, id: 'e2', group: 'expense', subGroup: 'fixed_expense', name: '보험', icon: 'shield_check', color: '#D8635A', sortOrder: 1 },
  { ...base, id: 'e3', group: 'expense', subGroup: 'variable_common', name: '식비', icon: 'bowl_food', color: '#D8635A', sortOrder: 0 },
  { ...base, id: 'e4', group: 'expense', subGroup: 'variable_personal', name: '교통', icon: 'bus', color: '#D8635A', sortOrder: 0 },
  { ...base, id: 'i1', group: 'income', subGroup: 'regular_income', name: '정기급여', icon: 'wallet', color: '#4CAF86', sortOrder: 0 },
  { ...base, id: 'f1', group: 'flex', subGroup: 'joint_flex', name: '여행', icon: 'airplane', color: '#F0A05E', sortOrder: 0 },
];

// '식비' 대분류 아래에 소분류(외식/장보기)가 있는 계층 세트 → 드릴다운 확인용.
const withChildren: CashbookCategory[] = [
  ...flat,
  { ...base, id: 'e3c1', group: 'expense', subGroup: 'variable_common', name: '외식', icon: 'fork_knife', color: '#D8635A', parentCategoryId: 'e3', sortOrder: 0 },
  { ...base, id: 'e3c2', group: 'expense', subGroup: 'variable_common', name: '장보기', icon: 'shopping_cart', color: '#D8635A', parentCategoryId: 'e3', sortOrder: 1 },
];

const meta: Meta<typeof CategoryFilterSheet> = {
  title: 'Cashbook/CategoryFilterSheet',
  component: CategoryFilterSheet,
  decorators: [
    (Story) => (
      <Sheet open>
        <Story />
      </Sheet>
    ),
  ],
  args: {
    onApply: (names: string[]) => console.log('apply', names),
    onClose: () => console.log('close'),
  },
};

export default meta;
type Story = StoryObj<typeof CategoryFilterSheet>;

/** 플랫 카테고리, 아무것도 선택 안 됨. */
export const Default: Story = {
  args: { categories: flat, initialSelected: [] },
};

/** 이미 두 개 선택된 상태. */
export const WithSelection: Story = {
  args: { categories: flat, initialSelected: ['식비', '교통'] },
};

/** 현재 탭(지출) 카테고리가 전부 선택돼 푸터 버튼이 '전체 해제'로 바뀐 상태. */
export const AllExpenseSelected: Story = {
  args: { categories: flat, initialSelected: ['월세', '보험', '식비', '교통'] },
};

/** 대분류 아래 소분류가 있어 드릴다운(›)이 뜨는 경우. */
export const WithChildren: Story = {
  args: { categories: withChildren, initialSelected: ['외식'] },
};

/** 해당 타입에 카테고리가 없을 때. */
export const EmptyType: Story = {
  args: { categories: flat, initialSelected: [], initialType: 'flex' },
};
