import { useState, type ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { PeriodCompareChart } from './PeriodCompareChart';
import type { PeriodComparison } from '@/hooks/useDashboardData';

const CHIP_COLORS = ['#D8635A', '#4CAF86', '#3B82F6', '#F59E0B', '#8B5CF6'];

type ChartProps = ComponentProps<typeof PeriodCompareChart>;

// 선택 칩의 X로 비교 대상을 빼볼 수 있게 상태를 들고 있는 래퍼 (시트 열기는 스토리에서 생략)
function Interactive({ initialSelected, ...args }: ChartProps & { initialSelected?: string[] }) {
  const rows = args.comparison.rows;
  const [selected, setSelected] = useState<string[]>(
    initialSelected ?? rows.slice(0, 3).map((r) => r.category)
  );
  return (
    <PeriodCompareChart
      {...args}
      categoryColors={Object.fromEntries(
        rows.map((r, i) => [r.category, CHIP_COLORS[i % CHIP_COLORS.length]])
      )}
      selectedCategories={selected}
      onRemoveCategory={(name) => setSelected((prev) => prev.filter((n) => n !== name))}
      onSelectCategoriesClick={() => {}}
    />
  );
}

const meta: Meta<typeof PeriodCompareChart> = {
  title: 'Dashboard/PeriodCompareChart',
  component: PeriodCompareChart,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[420px] rounded-xl border border-border bg-card p-4">
        <Story />
      </div>
    ),
  ],
  args: {
    group: 'expense',
    currentLabel: '2026년 10월',
    compareLabel: '2026년 9월',
    compareHint: '전월',
    onCompareClick: () => {},
    categoryColors: {},
    selectedCategories: [],
    onRemoveCategory: () => {},
    onSelectCategoriesClick: () => {},
  },
  render: (args) => <Interactive {...args} />,
};
export default meta;

type Story = StoryObj<typeof PeriodCompareChart>;

const expenseComparison: PeriodComparison = {
  currentTotal: 1_480_000,
  compareTotal: 1_250_000,
  rows: [
    { category: '월세', current: 700_000, compare: 700_000 },
    { category: '식비', current: 420_000, compare: 310_000 },
    { category: '교통', current: 160_000, compare: 140_000 },
    { category: '공과금', current: 120_000, compare: 100_000 },
    { category: '데이트', current: 80_000, compare: 0 },
  ],
};

export const ExpenseIncreased: Story = {
  args: { comparison: expenseComparison },
};

export const IncomeDecreased: Story = {
  args: {
    group: 'income',
    comparison: {
      currentTotal: 3_200_000,
      compareTotal: 3_700_000,
      rows: [
        { category: '정기급여', current: 3_200_000, compare: 3_200_000 },
        { category: '상여', current: 0, compare: 500_000 },
      ],
    },
  },
};

export const NetBalance: Story = {
  args: {
    group: 'all',
    comparison: {
      currentTotal: -120_000,
      compareTotal: 450_000,
      rows: [
        { category: '정기급여', current: 3_200_000, compare: 3_200_000 },
        { category: '월세', current: 700_000, compare: 700_000 },
        { category: '식비', current: 420_000, compare: 310_000 },
      ],
    },
  },
};

export const CustomComparePeriod: Story = {
  args: {
    compareLabel: '2025년 10월',
    compareHint: undefined,
    comparison: expenseComparison,
  },
};

export const NoChange: Story = {
  args: {
    comparison: {
      currentTotal: 700_000,
      compareTotal: 700_000,
      rows: [{ category: '월세', current: 700_000, compare: 700_000 }],
    },
  },
};

export const LongCategoryNames: Story = {
  args: {
    comparison: {
      currentTotal: 530_000,
      compareTotal: 410_000,
      rows: [
        { category: '아주아주긴카테고리이름', current: 330_000, compare: 210_000 },
        { category: '명절 용돈', current: 200_000, compare: 200_000 },
      ],
    },
  },
};

export const NoCategorySelected: Story = {
  args: { comparison: expenseComparison },
  render: (args) => <Interactive {...args} initialSelected={[]} />,
};

export const Empty: Story = {
  args: { comparison: { currentTotal: 0, compareTotal: 0, rows: [] } },
};

export const Loading: Story = {
  args: { comparison: expenseComparison, isLoading: true },
};
