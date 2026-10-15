import type { Meta, StoryObj } from '@storybook/react';
import type { YearProjection } from '@/utils/upcoming-fixed';
import { YearProjectionChart } from './YearProjectionChart';

const meta: Meta<typeof YearProjectionChart> = {
  title: 'Dashboard/YearProjectionChart',
  component: YearProjectionChart,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[360px] rounded-xl border border-border bg-card p-4">
        <Story />
      </div>
    ),
  ],
  args: {
    onUpcomingClick: () => {},
  },
};
export default meta;

type Story = StoryObj<typeof YearProjectionChart>;

/** 스토리용: currentMonth까지는 실제, 이번 달부터는 매달 fixed만큼 예정 */
function makeProjection(opts: {
  currentMonth: number;
  monthlyActual: number;
  fixedPerMonth: number;
  thisMonthActualRatio?: number;
}): YearProjection {
  const ratio = opts.thisMonthActualRatio ?? 0.5;
  const months = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const isPast = month < opts.currentMonth;
    const isCurrent = month === opts.currentMonth;
    const actual = isPast
      ? Math.round(opts.monthlyActual * (0.8 + ((month * 37) % 5) / 10))
      : isCurrent
        ? Math.round(opts.monthlyActual * ratio)
        : 0;
    const upcoming = isPast
      ? 0
      : isCurrent
        ? Math.round(opts.fixedPerMonth * 0.7)
        : opts.fixedPerMonth;
    return { month, actual, upcoming };
  });
  const actualTotal = months.reduce((s, m) => s + m.actual, 0);
  const upcomingTotal = months.reduce((s, m) => s + m.upcoming, 0);
  return {
    months,
    currentMonth: opts.currentMonth,
    actualTotal,
    upcomingTotal,
    projectedTotal: actualTotal + upcomingTotal,
  };
}

/** 지출: 10월 기준, 남은 세 달에 고정 지출이 빗금으로 선다 */
export const ExpenseOctober: Story = {
  args: {
    group: 'expense',
    upcomingCount: 7,
    projection: makeProjection({
      currentMonth: 10,
      monthlyActual: 2_400_000,
      fixedPerMonth: 1_300_000,
    }),
  },
};

/** 수입: 월급이 매달 들어올 예정 */
export const IncomeMay: Story = {
  args: {
    group: 'income',
    upcomingCount: 8,
    projection: makeProjection({
      currentMonth: 5,
      monthlyActual: 3_200_000,
      fixedPerMonth: 3_000_000,
    }),
  },
};

/** 연초: 실제는 거의 없고 열두 달이 거의 예정뿐 */
export const January: Story = {
  args: {
    group: 'expense',
    upcomingCount: 24,
    projection: makeProjection({
      currentMonth: 1,
      monthlyActual: 2_000_000,
      fixedPerMonth: 1_300_000,
      thisMonthActualRatio: 0.1,
    }),
  },
};

/** 12월: 남은 예정이 이번 달뿐 */
export const December: Story = {
  args: {
    group: 'expense',
    upcomingCount: 1,
    projection: makeProjection({
      currentMonth: 12,
      monthlyActual: 2_400_000,
      fixedPerMonth: 800_000,
    }),
  },
};

/** 변동 지출 탭처럼 예정이 없는 경우: 실제 막대만, 칩 없음 */
export const NoUpcoming: Story = {
  args: {
    group: 'expense',
    upcomingCount: 0,
    projection: makeProjection({ currentMonth: 8, monthlyActual: 1_500_000, fixedPerMonth: 0 }),
  },
};
