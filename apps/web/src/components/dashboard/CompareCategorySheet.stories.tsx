import type { Meta, StoryObj } from '@storybook/react';
import { Sheet } from '@uandi/ui';
import { CompareCategorySheet, type CompareCategoryOption } from './CompareCategorySheet';

const meta: Meta<typeof CompareCategorySheet> = {
  title: 'Dashboard/CompareCategorySheet',
  component: CompareCategorySheet,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <Sheet open>
        <Story />
      </Sheet>
    ),
  ],
  args: {
    onApply: () => {},
    onClose: () => {},
  },
};
export default meta;

type Story = StoryObj<typeof CompareCategorySheet>;

const COLORS = ['#D8635A', '#4CAF86', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6'];
const NAMES = [
  '정기급여',
  '격월 상여',
  '여행',
  '주담대 대출이자',
  '식비',
  '적금',
  '데이트',
  '병원/건강',
  '소모품',
  '교통비',
  '사회생활',
  '공과금',
  '코스트코',
  '가족',
  '개발 인프라',
  '정기결제',
  '보험비',
  '서비스 구독',
  '집꾸미기',
  '통신비',
];

const ICONS = ['wallet', 'gift', 'airplane', 'bank', 'bowl_food', 'piggy_bank', 'heart'];

const manyOptions: CompareCategoryOption[] = NAMES.map((name, i) => ({
  name,
  color: COLORS[i % COLORS.length],
  icon: ICONS[i % ICONS.length],
  parent: null,
}));

// 상위(식비·주거) 아래 하위가 있는 2단계 구조. 식비는 상위에 직접 기록된 내역도 있다.
const nestedOptions: CompareCategoryOption[] = [
  { name: '식비', color: '#D8635A', icon: 'bowl_food', parent: null },
  { name: '외식', color: '#F59E0B', icon: 'fork_knife', parent: '식비', parentIcon: 'bowl_food' },
  {
    name: '장보기',
    color: '#4CAF86',
    icon: 'shopping_bag',
    parent: '식비',
    parentIcon: 'bowl_food',
  },
  { name: '배달', color: '#3B82F6', icon: 'bowl_food', parent: '식비', parentIcon: 'bowl_food' },
  { name: '월세', color: '#8B5CF6', icon: 'house', parent: '주거', parentIcon: 'house' },
  { name: '관리비', color: '#EC4899', icon: 'lightbulb', parent: '주거', parentIcon: 'house' },
  { name: '교통', color: '#14B8A6', icon: 'bus', parent: null },
];

// 삭제된 카테고리처럼 아이콘을 모르는 항목은 색 점으로 표시된다.
const withUnknownIconOptions: CompareCategoryOption[] = [
  { name: '식비', color: '#D8635A', icon: 'bowl_food', parent: null },
  { name: '삭제된 카테고리', color: '#9CA3AF', parent: null },
  { name: '교통', color: '#14B8A6', icon: 'bus', parent: null },
];

export const ManyCategories: Story = {
  args: { options: manyOptions, initialSelected: ['정기급여', '격월 상여', '여행'] },
};

export const NestedCategories: Story = {
  args: { options: nestedOptions, initialSelected: ['외식', '월세', '관리비'] },
};

export const NothingSelected: Story = {
  args: { options: manyOptions, initialSelected: [] },
};

export const FewCategories: Story = {
  args: { options: manyOptions.slice(0, 3), initialSelected: ['정기급여'] },
};

export const UnknownIconFallback: Story = {
  args: { options: withUnknownIconOptions, initialSelected: [] },
};
