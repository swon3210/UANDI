import type { Meta, StoryObj } from '@storybook/react';
import { BudgetVsActualChart } from './BudgetVsActualChart';

const meta: Meta<typeof BudgetVsActualChart> = {
  title: 'Inner/BudgetVsActualChart',
  component: BudgetVsActualChart,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof BudgetVsActualChart>;

export const Default: Story = {
  render: () => (
    <div className="mx-auto max-w-md">
      <BudgetVsActualChart
        data={[
          { category: '식비', budget: 300_000, actual: 240_000 },
          { category: '교통', budget: 100_000, actual: 80_000 },
          { category: '월세', budget: 600_000, actual: 600_000 },
          { category: '보험', budget: 150_000, actual: 150_000 },
        ]}
      />
    </div>
  ),
};

// 일부 카테고리가 예산을 초과한 경우
export const OverBudget: Story = {
  render: () => (
    <div className="mx-auto max-w-md">
      <BudgetVsActualChart
        data={[
          { category: '식비', budget: 300_000, actual: 420_000 },
          { category: '교통', budget: 100_000, actual: 165_000 },
          { category: '여가', budget: 80_000, actual: 50_000 },
        ]}
      />
    </div>
  ),
};

// 카테고리가 많고 라벨이 긴 경우 — 좁은 화면에서 x축 라벨이 겹치지 않아야 함
export const ManyLongLabels: Story = {
  render: () => (
    <div className="mx-auto max-w-sm">
      <BudgetVsActualChart
        data={[
          { category: '식비', budget: 300_000, actual: 240_000 },
          { category: '교통', budget: 100_000, actual: 80_000 },
          { category: '문화생활', budget: 80_000, actual: 120_000 },
          { category: '경조사비', budget: 150_000, actual: 50_000 },
          { category: '생활용품', budget: 90_000, actual: 110_000 },
          { category: '의료/건강', budget: 60_000, actual: 30_000 },
        ]}
      />
    </div>
  ),
};

export const Empty: Story = {
  render: () => (
    <div className="mx-auto max-w-md">
      <BudgetVsActualChart data={[]} />
    </div>
  ),
};
