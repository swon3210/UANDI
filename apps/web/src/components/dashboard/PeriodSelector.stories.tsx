import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { PeriodSelector } from './PeriodSelector';
import type { PeriodKind } from '@/utils/date';

const meta: Meta<typeof PeriodSelector> = {
  title: 'Dashboard/PeriodSelector',
  component: PeriodSelector,
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

type Story = StoryObj<typeof PeriodSelector>;

function Interactive(initial: PeriodKind) {
  const [value, setValue] = useState<PeriodKind>(initial);
  return <PeriodSelector value={value} onChange={setValue} />;
}

export const Weekly: Story = { render: () => Interactive('weekly') };
export const Monthly: Story = { render: () => Interactive('monthly') };
export const Yearly: Story = { render: () => Interactive('yearly') };
