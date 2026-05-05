import type { Meta, StoryObj } from '@storybook/react';
import { BudgetTrendChart } from './BudgetTrendChart';
import type { TrendPoint } from '@/hooks/useDashboardData';

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

const weeklyData = (): TrendPoint[] =>
  ['일', '월', '화', '수', '목', '금', '토'].map((label, i) => ({
    label,
    bucketKey: `2026-05-0${i + 1}`,
    total: [12000, 0, 8000, 24000, 5000, 0, 30000][i],
  }));

const monthlyData = (): TrendPoint[] =>
  Array.from({ length: 31 }, (_, i) => ({
    label: String(i + 1),
    bucketKey: `2026-05-${String(i + 1).padStart(2, '0')}`,
    total: i % 3 === 0 ? 30000 + i * 1500 : 0,
  }));

const yearlyData = (): TrendPoint[] =>
  Array.from({ length: 12 }, (_, i) => ({
    label: `${i + 1}월`,
    bucketKey: `2026-${String(i + 1).padStart(2, '0')}`,
    total: 200_000 + i * 80_000,
  }));

const emptyData = (): TrendPoint[] =>
  ['일', '월', '화', '수', '목', '금', '토'].map((label, i) => ({
    label,
    bucketKey: `2026-05-0${i + 1}`,
    total: 0,
  }));

export const Weekly: Story = {
  render: () => <BudgetTrendChart data={weeklyData()} group="expense" />,
};

export const Monthly: Story = {
  render: () => <BudgetTrendChart data={monthlyData()} group="expense" />,
};

export const YearlyIncome: Story = {
  render: () => <BudgetTrendChart data={yearlyData()} group="income" />,
};

export const Empty: Story = {
  render: () => <BudgetTrendChart data={emptyData()} group="all" />,
};
