import type { Meta, StoryObj } from '@storybook/react';
import { DailyCumulativeChart, type DailyCumulativePoint } from './DailyCumulativeChart';

const meta: Meta<typeof DailyCumulativeChart> = {
  title: 'Inner/DailyCumulativeChart',
  component: DailyCumulativeChart,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof DailyCumulativeChart>;

// daysInMonth일 중 today일까지 누적, 일평균 dailyAvg씩 증가
function sample(daysInMonth: number, today: number, dailyAvg: number): DailyCumulativePoint[] {
  const data: DailyCumulativePoint[] = [];
  let acc = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    if (day <= today) acc += dailyAvg * (0.6 + (day % 4) * 0.3);
    data.push({ day, cumulative: day <= today ? Math.round(acc) : null });
  }
  return data;
}

// 월중 — 누적이 천장에 한참 못 미침 (여유)
export const MidMonth: Story = {
  render: () => (
    <div className="mx-auto max-w-md">
      <DailyCumulativeChart data={sample(30, 18, 25_000)} budgetCeiling={900_000} />
    </div>
  ),
};

// 천장 초과 직전 — 누적이 예산선에 거의 닿음
export const NearCeiling: Story = {
  render: () => (
    <div className="mx-auto max-w-md">
      <DailyCumulativeChart data={sample(30, 22, 42_000)} budgetCeiling={900_000} />
    </div>
  ),
};

// 예산 없음 — 천장선 미표시
export const NoBudget: Story = {
  render: () => (
    <div className="mx-auto max-w-md">
      <DailyCumulativeChart data={sample(30, 18, 25_000)} budgetCeiling={0} />
    </div>
  ),
};

export const Empty: Story = {
  render: () => (
    <div className="mx-auto max-w-md">
      <DailyCumulativeChart
        data={Array.from({ length: 30 }, (_, i) => ({ day: i + 1, cumulative: 0 }))}
        budgetCeiling={900_000}
      />
    </div>
  ),
};
