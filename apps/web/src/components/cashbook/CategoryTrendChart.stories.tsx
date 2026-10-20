import type { Meta, StoryObj } from '@storybook/react';
import { CategoryTrendChart } from './CategoryTrendChart';

const meta: Meta<typeof CategoryTrendChart> = {
  title: 'Cashbook/CategoryTrendChart',
  component: CategoryTrendChart,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[360px] rounded-xl border border-border bg-card p-4">
        <Story />
      </div>
    ),
  ],
  args: {
    group: 'expense',
    median: 200_000,
    points: [
      { label: '4월', amount: 180_000, isCurrent: false },
      { label: '5월', amount: 0, isCurrent: false },
      { label: '6월', amount: 220_000, isCurrent: false },
      { label: '7월', amount: 0, isCurrent: false },
      { label: '8월', amount: 200_000, isCurrent: false },
      { label: '9월', amount: 0, isCurrent: false },
      { label: '10월', amount: 3_533_000, isCurrent: true },
    ],
  },
};
export default meta;

type Story = StoryObj<typeof CategoryTrendChart>;

/** 이번 달이 평소보다 훨씬 큰 경우 (평소 점선이 바닥에 깔린다) */
export const Spike: Story = {};

export const Income: Story = {
  args: {
    group: 'income',
    median: 3_000_000,
    points: [
      { label: '7월', amount: 3_000_000, isCurrent: false },
      { label: '8월', amount: 3_000_000, isCurrent: false },
      { label: '9월', amount: 3_000_000, isCurrent: false },
      { label: '10월', amount: 1_000_000, isCurrent: true },
    ],
  },
};

/** 평소 금액이 없으면 점선 없이 막대만 */
export const NoMedian: Story = {
  args: { median: null },
};

/** 이번 달 0원 (missing) */
export const MissingThisMonth: Story = {
  args: {
    median: 700_000,
    points: [
      { label: '8월', amount: 700_000, isCurrent: false },
      { label: '9월', amount: 700_000, isCurrent: false },
      { label: '10월', amount: 0, isCurrent: true },
    ],
  },
};
