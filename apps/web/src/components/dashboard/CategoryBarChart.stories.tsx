import type { Meta, StoryObj } from '@storybook/react';
import { CategoryBarChart } from './CategoryBarChart';
import type { CategorySlice } from '@/hooks/useDashboardData';

const meta: Meta<typeof CategoryBarChart> = {
  title: 'Dashboard/CategoryBarChart',
  component: CategoryBarChart,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[420px] rounded-xl border border-border bg-card p-4">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof CategoryBarChart>;

const slice = (category: string, amount: number, color: string): CategorySlice => ({
  category,
  amount,
  color,
});

export const Default: Story = {
  render: () => (
    <CategoryBarChart
      data={[
        slice('식비', 320000, '#D8635A'),
        slice('교통', 180000, '#4CAF86'),
        slice('쇼핑', 95000, '#3B82F6'),
      ]}
    />
  ),
};

// 최대 개수 제한 제거 — 많은 카테고리도 모두 비교할 수 있다.
export const ManyCategories: Story = {
  render: () => (
    <CategoryBarChart
      data={[
        slice('식비', 520000, '#D8635A'),
        slice('월세', 450000, '#4CAF86'),
        slice('교통', 180000, '#3B82F6'),
        slice('쇼핑', 95000, '#F59E0B'),
        slice('의료', 62000, '#8B5CF6'),
        slice('문화생활', 48000, '#EC4899'),
        slice('보험', 30000, '#14B8A6'),
      ]}
    />
  ),
};

export const Single: Story = {
  render: () => <CategoryBarChart data={[slice('식비', 320000, '#D8635A')]} />,
};

export const LongLabel: Story = {
  render: () => (
    <CategoryBarChart
      data={[
        slice('정기급여 및 상여금', 3_000_000, '#4CAF86'),
        slice('투자수익', 1_200_000, '#3B82F6'),
      ]}
    />
  ),
};

export const Empty: Story = {
  render: () => <CategoryBarChart data={[]} />,
};
