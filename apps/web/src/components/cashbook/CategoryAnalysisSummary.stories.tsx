import type { Meta, StoryObj } from '@storybook/react';
import { CategoryAnalysisSummary } from './CategoryAnalysisSummary';

const meta: Meta<typeof CategoryAnalysisSummary> = {
  title: 'Cashbook/CategoryAnalysisSummary',
  component: CategoryAnalysisSummary,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[360px] rounded-xl border border-border bg-card p-4">
        <Story />
      </div>
    ),
  ],
  args: {
    category: '여행',
    group: 'expense',
    monthLabel: '2026년 10월',
    currentAmount: 3_533_000,
    median: 92_000,
    sampleMonths: 5,
    windowMonths: 6,
  },
};
export default meta;

type Story = StoryObj<typeof CategoryAnalysisSummary>;

export const Expense: Story = {};

export const VariableScope: Story = {
  args: { scopeLabel: '변동 지출' },
};

export const Income: Story = {
  args: { category: '상여', group: 'income', currentAmount: 0, median: 500_000 },
};

/** 지난달 기록이 부족해 평소 금액이 없는 경우 */
export const NoMedian: Story = {
  args: { median: null, sampleMonths: 1 },
};

export const LongName: Story = {
  args: { category: '아주아주긴카테고리이름입니다정말로', currentAmount: 123_456_789 },
};
