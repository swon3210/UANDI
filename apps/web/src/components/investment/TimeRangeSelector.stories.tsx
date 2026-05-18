import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ForexRange } from '@uandi/investment-core';
import { TimeRangeSelector } from './TimeRangeSelector';

function TimeRangeSelectorDemo() {
  const [range, setRange] = useState<ForexRange>('1m');
  return <TimeRangeSelector value={range} onChange={setRange} />;
}

const meta: Meta<typeof TimeRangeSelector> = {
  title: 'Investment/TimeRangeSelector',
  component: TimeRangeSelector,
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof TimeRangeSelector>;

export const Default: Story = {
  render: () => <TimeRangeSelectorDemo />,
};
