import type { Meta, StoryObj } from '@storybook/react-vite';
import dayjs from 'dayjs';
import type { ExchangeRatePoint } from '@uandi/investment-core';
import { ExchangeRateChart } from './ExchangeRateChart';

const meta: Meta<typeof ExchangeRateChart> = {
  title: 'Investment/ExchangeRateChart',
  component: ExchangeRateChart,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[640px]">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof ExchangeRateChart>;

function buildSeries(days: number, base: number, amp: number): ExchangeRatePoint[] {
  const points: ExchangeRatePoint[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
    const wave = Math.sin(i / 5) * amp * 0.4 + (Math.random() - 0.5) * amp * 0.2;
    points.push({ date, rate: base + wave });
  }
  return points;
}

export const Usd90Days: Story = {
  args: {
    currency: 'USD',
    points: buildSeries(90, 1380, 30),
  },
};

export const JpyVolatile: Story = {
  args: {
    currency: 'JPY',
    points: buildSeries(60, 9.1, 0.4),
  },
};

export const ShortRange: Story = {
  args: {
    currency: 'EUR',
    points: buildSeries(7, 1480, 5),
  },
};
