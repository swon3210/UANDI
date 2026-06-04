import type { Meta, StoryObj } from '@storybook/react';
import { IncomeExpensePieChart } from './IncomeExpensePieChart';

const meta: Meta<typeof IncomeExpensePieChart> = {
  title: 'Inner/IncomeExpensePieChart',
  component: IncomeExpensePieChart,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof IncomeExpensePieChart>;

// 수입 vs 지출 요약
export const IncomeVsExpense: Story = {
  render: () => (
    <div className="mx-auto max-w-md">
      <IncomeExpensePieChart
        data={[
          { name: '수입', value: 3_000_000 },
          { name: '지출', value: 2_100_000 },
        ]}
      />
    </div>
  ),
};

// 카테고리별 지출 구성
export const ExpenseByCategory: Story = {
  render: () => (
    <div className="mx-auto max-w-md">
      <IncomeExpensePieChart
        data={[
          { name: '식비', value: 420_000 },
          { name: '월세', value: 600_000 },
          { name: '교통', value: 90_000 },
          { name: '여가', value: 150_000 },
          { name: '보험', value: 150_000 },
        ]}
      />
    </div>
  ),
};

export const Empty: Story = {
  render: () => (
    <div className="mx-auto max-w-md">
      <IncomeExpensePieChart data={[]} />
    </div>
  ),
};
