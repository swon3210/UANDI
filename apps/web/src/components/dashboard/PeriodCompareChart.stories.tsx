import type { ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { PeriodCompareChart } from './PeriodCompareChart';
import type { PeriodComparison } from '@/hooks/useDashboardData';

type ChartProps = ComponentProps<typeof PeriodCompareChart>;

// 기본은 상위 3개 카테고리를 선택한 상태로 보여준다 (시트 열기는 스토리에서 생략)
function WithSelection({ initialSelected, ...args }: ChartProps & { initialSelected?: string[] }) {
  const selected = initialSelected ?? args.comparison.rows.slice(0, 3).map((r) => r.category);
  return <PeriodCompareChart {...args} selectedCategories={selected} />;
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
    selectedCategories: [],
    onSelectCategoriesClick: () => {},
  },
  render: (args) => <WithSelection {...args} />,
};
export default meta;

type Story = StoryObj<typeof PeriodCompareChart>;

const expenseComparison: PeriodComparison = {
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

export const ExpenseDecreased: Story = {
  args: {
    comparison: {
      rows: [
        { category: '식비', current: 280_000, compare: 420_000 },
        { category: '교통', current: 120_000, compare: 160_000 },
      ],
    },
  },
};

export const IncomeDecreased: Story = {
  args: {
    group: 'income',
    comparison: {
      rows: [
        { category: '정기급여', current: 3_200_000, compare: 3_200_000 },
        { category: '상여', current: 0, compare: 500_000 },
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
      rows: [{ category: '월세', current: 700_000, compare: 700_000 }],
    },
  },
};

export const LongCategoryNames: Story = {
  args: {
    comparison: {
      rows: [
        { category: '아주아주긴카테고리이름', current: 330_000, compare: 210_000 },
        { category: '명절 용돈', current: 200_000, compare: 200_000 },
      ],
    },
  },
};

// 고정/변동 탭: 카테고리를 고르지 않으면 세부 그룹 총액 1줄로 비교
export const TotalWhenNoneSelected: Story = {
  args: { comparison: expenseComparison, totalRowLabel: '전체 고정 지출' },
  render: (args) => <WithSelection {...args} initialSelected={[]} />,
};

// 지출·수입 '전체' 탭: 총액만 비교하고 카테고리 선택 영역이 없다
export const TotalOnly: Story = {
  args: {
    comparison: expenseComparison,
    totalRowLabel: '전체 지출',
    onSelectCategoriesClick: undefined,
  },
  render: (args) => <WithSelection {...args} initialSelected={[]} />,
};

export const NoCategorySelected: Story = {
  args: { comparison: expenseComparison },
  render: (args) => <WithSelection {...args} initialSelected={[]} />,
};

export const Empty: Story = {
  args: { comparison: { rows: [] } },
};

export const Loading: Story = {
  args: { comparison: expenseComparison, isLoading: true },
};

// 비교 대상을 평소(최근 6개월 중위값)로 고른 경우. 막대는 카테고리별 중위값,
// 요약 합계는 묶음 합계의 중위값(compareTotal)이라 막대 합과 다를 수 있다.
export const MedianTarget: Story = {
  args: {
    comparison: {
      rows: [
        { category: '여행', current: 3_533_000, compare: 200_000 },
        { category: '식비', current: 1_100_000, compare: 1_500_000 },
        { category: '데이트', current: 60_000, compare: 0 },
      ],
    },
    compareLabel: '평소',
    compareHint: '6개월 중위값',
    totalRowLabel: '전체 변동 지출',
    compareTotal: 1_650_000,
    analysisHref: '#',
  },
  render: (args) => <WithSelection {...args} initialSelected={[]} />,
};

// 평소 표본(기록 있는 지난달)이 2개월 미만이면 요약·차트 대신 안내
export const MedianUnavailable: Story = {
  args: {
    comparison: { rows: [] },
    compareLabel: '평소',
    compareHint: '6개월 중위값',
    unavailableMessage: '지난달 기록이 2개월 이상 쌓이면 평소와 비교해 드려요',
  },
};

// 월간 탭: 고른 카테고리 묶음을 한 번에 AI 종합 분석하는 버튼
export const WithAiAnalysis: Story = {
  args: { comparison: expenseComparison, analysisHref: '#' },
};

// 고정/변동 탭에서 고른 게 없으면 버튼은 범위 전체(전체 고정 지출) 분석
export const WithAiAnalysisTotal: Story = {
  args: { comparison: expenseComparison, totalRowLabel: '전체 고정 지출', analysisHref: '#' },
  render: (args) => <WithSelection {...args} initialSelected={[]} />,
};
