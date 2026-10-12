import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { SubGroupTabs } from './SubGroupTabs';
import type { SubGroupFilter } from '@/hooks/useDashboardData';

const meta: Meta<typeof SubGroupTabs> = {
  title: 'Dashboard/SubGroupTabs',
  component: SubGroupTabs,
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

type Story = StoryObj<typeof SubGroupTabs>;

function Interactive({ groupLabel }: { groupLabel: '지출' | '수입' }) {
  const [value, setValue] = useState<SubGroupFilter>('all');
  return <SubGroupTabs groupLabel={groupLabel} value={value} onChange={setValue} />;
}

export const Expense: Story = {
  render: () => <Interactive groupLabel="지출" />,
};

export const Income: Story = {
  render: () => <Interactive groupLabel="수입" />,
};

export const FixedSelected: Story = {
  args: { groupLabel: '지출', value: 'fixed', onChange: () => {} },
};
