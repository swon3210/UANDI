import type { Meta, StoryObj } from '@storybook/react';
import { CategoryBreakdown } from './CategoryBreakdown';
import type { CategoryTreeSlice } from '@/hooks/useDashboardData';

const meta: Meta<typeof CategoryBreakdown> = {
  title: 'Dashboard/CategoryBreakdown',
  component: CategoryBreakdown,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[380px] rounded-xl border border-border bg-card p-4">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof CategoryBreakdown>;

const nested: CategoryTreeSlice[] = [
  {
    category: '식비',
    amount: 1_200_000,
    color: '#D8635A',
    children: [
      { category: '외식', amount: 600_000, color: '#D8635A' },
      { category: '장보기', amount: 450_000, color: '#4CAF86' },
      { category: '식비(기타)', amount: 150_000, color: '#3B82F6' },
    ],
  },
  {
    category: '주거',
    amount: 900_000,
    color: '#4CAF86',
    children: [
      { category: '관리비', amount: 600_000, color: '#D8635A' },
      { category: '공과금', amount: 300_000, color: '#4CAF86' },
    ],
  },
  { category: '교통', amount: 300_000, color: '#3B82F6', children: [] },
];

/** 식비·주거는 눌러서 하위로 펼칠 수 있다 */
export const WithSubcategories: Story = { args: { data: nested } };

export const FlatOnly: Story = {
  args: { data: nested.map((s) => ({ ...s, children: [] })) },
};
