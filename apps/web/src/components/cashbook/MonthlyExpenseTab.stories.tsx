import type { Meta, StoryObj } from '@storybook/react';
import { MonthlyExpenseTab } from './MonthlyExpenseTab';
import type { CategoryBudgetSummary, WeeklyExpense } from '@/hooks/useMonthlyBudget';

const meta: Meta<typeof MonthlyExpenseTab> = {
  title: 'Cashbook/MonthlyExpenseTab',
  component: MonthlyExpenseTab,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className="mx-auto w-[400px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MonthlyExpenseTab>;

// 기본 순서: 식비 → 교통 → 데이트 → 문화 (예산 설정 순서)
// 초과 정도: 데이트(140%) > 식비(108%) > 교통(90%) > 문화(40%)
const categoryBudgets: CategoryBudgetSummary[] = [
  {
    categoryId: 'food',
    categoryName: '식비',
    icon: 'bowl_food',
    budgetAmount: 600_000,
    actualAmount: 650_000,
    percentage: 100,
    status: 'danger',
    margin: -50_000,
  },
  {
    categoryId: 'transport',
    categoryName: '교통',
    icon: 'bus',
    budgetAmount: 200_000,
    actualAmount: 180_000,
    percentage: 90,
    status: 'warning',
    margin: 20_000,
  },
  {
    categoryId: 'date',
    categoryName: '데이트',
    icon: 'movie',
    budgetAmount: 200_000,
    actualAmount: 280_000,
    percentage: 100,
    status: 'danger',
    margin: -80_000,
  },
  {
    categoryId: 'culture',
    categoryName: '문화',
    icon: 'book',
    budgetAmount: 100_000,
    actualAmount: 40_000,
    percentage: 40,
    status: 'stable',
    margin: 60_000,
  },
];

const weeklyExpenses: WeeklyExpense[] = [
  { week: 1, budget: 250_000, actual: 230_000, status: 'stable' },
  { week: 2, budget: 250_000, actual: 310_000, status: 'danger' },
  { week: 3, budget: 250_000, actual: 240_000, status: 'warning' },
  { week: 4, budget: 250_000, actual: 0, status: 'future' },
];

/** 기본순 — 예산 설정 순서대로 노출 */
export const Default: Story = {
  args: { categoryBudgets, weeklyExpenses, initialSort: 'default' },
};

/** 초과순 진입 — 예산 알림 "자세히 보기"로 들어온 경우 (데이트·식비가 맨 위) */
export const OverFirst: Story = {
  args: { categoryBudgets, weeklyExpenses, initialSort: 'over' },
};

/** 카테고리가 1개면 정렬 컨트롤을 숨긴다 */
export const SingleCategory: Story = {
  args: { categoryBudgets: [categoryBudgets[0]], weeklyExpenses, initialSort: 'default' },
};

/** 예산 미설정 */
export const Empty: Story = {
  args: { categoryBudgets: [], weeklyExpenses: [], initialSort: 'default' },
};
