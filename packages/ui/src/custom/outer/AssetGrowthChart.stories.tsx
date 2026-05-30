import type { Meta, StoryObj } from '@storybook/react';
import { AssetGrowthChart, type AssetGrowthPoint } from './AssetGrowthChart';

const meta: Meta<typeof AssetGrowthChart> = {
  title: 'Outer/AssetGrowthChart',
  component: AssetGrowthChart,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof AssetGrowthChart>;

// 예적금 30 / 주식 30 / 부동산 25 / 코인 5 / 외환 10, 월 100만 납입, 10년 추정 느낌의 샘플
function sample(years: number): AssetGrowthPoint[] {
  const data: AssetGrowthPoint[] = [];
  for (let year = 0; year <= years; year++) {
    const months = year * 12;
    data.push({
      year,
      savings: Math.round(300_000 * months * 1.035),
      stocks: Math.round(300_000 * months * 1.07),
      realEstate: Math.round(250_000 * months * 1.04),
      crypto: Math.round(50_000 * months * 1.1),
      forex: Math.round(100_000 * months * 1.02),
    });
  }
  return data;
}

export const Default: Story = {
  render: () => (
    <div className="mx-auto max-w-md">
      <AssetGrowthChart data={sample(10)} />
    </div>
  ),
};

export const ShortHorizon: Story = {
  render: () => (
    <div className="mx-auto max-w-md">
      <AssetGrowthChart data={sample(3)} />
    </div>
  ),
};

export const Empty: Story = {
  render: () => (
    <div className="mx-auto max-w-md">
      <AssetGrowthChart
        data={[{ year: 0, savings: 0, stocks: 0, realEstate: 0, crypto: 0, forex: 0 }]}
      />
    </div>
  ),
};
