import type { Meta, StoryObj } from '@storybook/react';
import { BudgetTrendChart } from './BudgetTrendChart';
import type { TrendByCategoryPoint } from '@/hooks/useDashboardData';

const meta: Meta<typeof BudgetTrendChart> = {
  title: 'Dashboard/BudgetTrendChart',
  component: BudgetTrendChart,
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

type Story = StoryObj<typeof BudgetTrendChart>;

const weeklyData = (): TrendByCategoryPoint[] =>
  ['일', '월', '화', '수', '목', '금', '토'].map((label, i) => ({
    bucketKey: `2026-05-0${i + 1}`,
    label,
    식비: [12000, 8000, 0, 24000, 5000, 0, 30000][i],
    교통: [3000, 0, 5000, 2000, 0, 4000, 8000][i],
    쇼핑: [0, 0, 0, 0, 50000, 0, 12000][i],
  }));

const monthlyData = (): TrendByCategoryPoint[] =>
  Array.from({ length: 31 }, (_, i) => ({
    bucketKey: `2026-05-${String(i + 1).padStart(2, '0')}`,
    label: String(i + 1),
    식비: i % 3 === 0 ? 30000 + i * 1000 : 0,
    교통: i % 5 === 0 ? 8000 + i * 500 : 0,
  }));

const yearlyData = (): TrendByCategoryPoint[] =>
  Array.from({ length: 12 }, (_, i) => ({
    bucketKey: `2026-${String(i + 1).padStart(2, '0')}`,
    label: `${i + 1}월`,
    정기급여: 3_000_000,
    인센티브: i % 4 === 0 ? 1_500_000 : 0,
  }));

export const Weekly: Story = {
  render: () => (
    <BudgetTrendChart
      data={weeklyData()}
      selectedCategories={[
        { name: '식비', color: '#E8837A' },
        { name: '교통', color: '#F9B2AC' },
        { name: '쇼핑', color: '#BE4B44' },
      ]}
    />
  ),
};

export const Monthly: Story = {
  render: () => (
    <BudgetTrendChart
      data={monthlyData()}
      selectedCategories={[
        { name: '식비', color: '#D8635A' },
        { name: '교통', color: '#98D9BF' },
      ]}
    />
  ),
};

export const YearlyIncome: Story = {
  render: () => (
    <BudgetTrendChart
      data={yearlyData()}
      selectedCategories={[
        { name: '정기급여', color: '#4CAF86' },
        { name: '인센티브', color: '#368869' },
      ]}
    />
  ),
};

export const NoSelection: Story = {
  render: () => <BudgetTrendChart data={weeklyData()} selectedCategories={[]} />,
};
