import type { Meta, StoryObj } from '@storybook/react';
import type { MonthProjection, MonthProjectionPoint } from '@/utils/upcoming-fixed';
import { MonthProjectionChart } from './MonthProjectionChart';

const meta: Meta<typeof MonthProjectionChart> = {
  title: 'Dashboard/MonthProjectionChart',
  component: MonthProjectionChart,
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

type Story = StoryObj<typeof MonthProjectionChart>;

/**
 * 스토리용 투영 생성기. 오늘(today)까지는 하루 평균만큼 실제가 쌓이고,
 * 그 뒤로는 upcoming에 적힌 날에 예정 금액이 계단으로 더해진다.
 */
function makeProjection(opts: {
  daysInMonth?: number;
  today: number;
  dailyActual: number;
  upcoming: Array<{ day: number; amount: number; name: string }>;
}): MonthProjection {
  const daysInMonth = opts.daysInMonth ?? 31;
  const points: MonthProjectionPoint[] = [];
  let actual = 0;
  for (let day = 1; day <= opts.today; day++) {
    actual += opts.dailyActual * (0.6 + ((day * 7) % 5) / 5);
    points.push({ day, actual: Math.round(actual), projected: null, items: [] });
  }
  const actualTotal = Math.round(actual);
  let projected = actualTotal;
  for (let day = opts.today; day <= daysInMonth; day++) {
    const due = opts.upcoming.filter((u) => u.day === day);
    projected += due.reduce((s, u) => s + u.amount, 0);
    const point = { day, actual: null, projected, items: due.map((u) => u.name) };
    if (day === opts.today) points[points.length - 1] = { ...point, actual: actualTotal };
    else points.push(point);
  }
  const upcomingTotal = opts.upcoming
    .filter((u) => u.day >= opts.today)
    .reduce((s, u) => s + u.amount, 0);
  return {
    points,
    today: opts.today,
    daysInMonth,
    actualTotal,
    upcomingTotal,
    projectedTotal: actualTotal + upcomingTotal,
  };
}

/** 지출: 15일 기준, 25일 월세·28일 보험이 남아 있다 */
export const ExpenseMidMonth: Story = {
  args: {
    group: 'expense',
    upcomingCount: 2,
    overdueCount: 0,
    projection: makeProjection({
      today: 15,
      dailyActual: 45_000,
      upcoming: [
        { day: 25, amount: 800_000, name: '월세' },
        { day: 28, amount: 150_000, name: '보험' },
      ],
    }),
  },
};

/** 수입: 월급이 25일에 들어올 예정 */
export const IncomePayday: Story = {
  args: {
    group: 'income',
    upcomingCount: 1,
    overdueCount: 0,
    projection: makeProjection({
      today: 12,
      dailyActual: 8_000,
      upcoming: [{ day: 25, amount: 3_000_000, name: '정기급여' }],
    }),
  },
};

/** 월초: 실제가 거의 없고 예정만 있다 */
export const EarlyMonth: Story = {
  args: {
    group: 'expense',
    upcomingCount: 3,
    overdueCount: 0,
    projection: makeProjection({
      today: 2,
      dailyActual: 12_000,
      upcoming: [
        { day: 5, amount: 50_000, name: '주차비' },
        { day: 25, amount: 800_000, name: '월세' },
        { day: 25, amount: 65_000, name: '통신비' },
      ],
    }),
  },
};

/** 월말: 예정이 모두 끝나 점선이 거의 없다 */
export const EndOfMonth: Story = {
  args: {
    group: 'expense',
    upcomingCount: 0,
    overdueCount: 0,
    projection: makeProjection({ today: 30, dailyActual: 40_000, upcoming: [] }),
  },
};

/** 미기록 항목이 있을 때 안내 줄 */
export const WithOverdue: Story = {
  args: {
    group: 'expense',
    upcomingCount: 1,
    overdueCount: 2,
    projection: makeProjection({
      today: 18,
      dailyActual: 30_000,
      upcoming: [{ day: 25, amount: 800_000, name: '월세' }],
    }),
  },
};

/** 변동 지출 탭처럼 예정이 없는 경우: 실선만 */
export const NoUpcoming: Story = {
  args: {
    group: 'expense',
    upcomingCount: 0,
    overdueCount: 0,
    projection: makeProjection({ today: 15, dailyActual: 25_000, upcoming: [] }),
  },
};
