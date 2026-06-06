import type { Meta, StoryObj } from '@storybook/react';
import { CashFlowChart, type CashFlowPoint } from './CashFlowChart';

const meta: Meta<typeof CashFlowChart> = {
  title: 'Inner/CashFlowChart',
  component: CashFlowChart,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof CashFlowChart>;

/**
 * pastNets: 과거~현재 6개월의 실제 순현금흐름(마지막 값 = 현재 달 = 실선↔점선 경계).
 * baseline: 미래 3개월의 예측 순현금흐름(평탄).
 * 경계(현재 달)는 actual과 forecast를 모두 가져 점선이 실선 끝점에서 이어진다.
 */
function sample(pastNets: number[], baseline: number): CashFlowPoint[] {
  const points: CashFlowPoint[] = [];
  pastNets.forEach((net, i) => {
    const isBoundary = i === pastNets.length - 1;
    points.push({
      month: (i % 12) + 1,
      actual: net,
      forecast: isBoundary ? net : null,
    });
  });
  for (let k = 1; k <= 3; k++) {
    points.push({
      month: ((pastNets.length - 1 + k) % 12) + 1,
      actual: null,
      forecast: baseline,
    });
  }
  return points;
}

// 상시 흑자 — 순흐름이 0선 위에 머무름
export const Positive: Story = {
  render: () => (
    <div className="mx-auto max-w-md">
      <CashFlowChart
        data={sample([800_000, 1_200_000, 600_000, 1_000_000, 900_000, 700_000], 850_000)}
      />
    </div>
  ),
};

// 흑/적자 혼재 — 0 기준선과 음수 틱 렌더 확인
export const Mixed: Story = {
  render: () => (
    <div className="mx-auto max-w-md">
      <CashFlowChart
        data={sample([500_000, -300_000, 800_000, -100_000, 400_000, -200_000], 200_000)}
      />
    </div>
  ),
};

// 상시 적자 — 예측도 음수
export const AllNegative: Story = {
  render: () => (
    <div className="mx-auto max-w-md">
      <CashFlowChart
        data={sample([-200_000, -500_000, -300_000, -400_000, -600_000, -350_000], -400_000)}
      />
    </div>
  ),
};

// 이력 희박 — 전부 0, 예측도 0
export const FlatZero: Story = {
  render: () => (
    <div className="mx-auto max-w-md">
      <CashFlowChart data={sample([0, 0, 0, 0, 0, 0], 0)} />
    </div>
  ),
};

// 방어용 — 값이 전부 비어 있는 경우(실제 앱에선 섹션을 숨김)
export const Empty: Story = {
  render: () => (
    <div className="mx-auto max-w-md">
      <CashFlowChart
        data={Array.from({ length: 9 }, (_, i) => ({
          month: (i % 12) + 1,
          actual: null,
          forecast: null,
        }))}
      />
    </div>
  ),
};
