import type { Meta, StoryObj } from '@storybook/react-vite';
import { IndicatorPanel } from './IndicatorPanel';

const meta: Meta<typeof IndicatorPanel> = {
  title: 'Investment/IndicatorPanel',
  component: IndicatorPanel,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[360px]">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof IndicatorPanel>;

export const FullData: Story = {
  args: {
    currency: 'USD',
    indicators: {
      current: 1380.5,
      ma5: 1378.1,
      ma20: 1375.2,
      ma60: 1360.8,
      rsi14: 42.3,
      percentile52w: 35,
    },
  },
};

export const PartialData: Story = {
  args: {
    currency: 'JPY',
    indicators: {
      current: 9.08,
      ma5: 9.05,
      ma20: null,
      ma60: null,
      rsi14: null,
      percentile52w: null,
    },
  },
};
