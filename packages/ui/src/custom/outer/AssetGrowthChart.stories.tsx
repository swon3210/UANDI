import type { Meta, StoryObj } from '@storybook/react';
import { AssetGrowthChart, type AssetGrowthPoint } from './AssetGrowthChart';

const meta: Meta<typeof AssetGrowthChart> = {
  title: 'Outer/AssetGrowthChart',
  component: AssetGrowthChart,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof AssetGrowthChart>;

// 현금 10 / 예적금 50 / 투자 40, 월 100만 납입, 10년 추정 느낌의 샘플
function sample(years: number): AssetGrowthPoint[] {
  const data: AssetGrowthPoint[] = [];
  for (let year = 0; year <= years; year++) {
    const months = year * 12;
    data.push({
      year,
      cash: Math.round(100_000 * months),
      savings: Math.round(500_000 * months * 1.03),
      investment: Math.round(400_000 * months * 1.07),
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
      <AssetGrowthChart data={[{ year: 0, cash: 0, savings: 0, investment: 0 }]} />
    </div>
  ),
};
