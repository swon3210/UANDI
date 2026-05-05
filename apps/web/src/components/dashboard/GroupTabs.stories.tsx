import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { GroupTabs } from './GroupTabs';
import type { GroupFilter } from '@/hooks/useDashboardData';

const meta: Meta<typeof GroupTabs> = {
  title: 'Dashboard/GroupTabs',
  component: GroupTabs,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[420px]">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof GroupTabs>;

function Interactive(initial: GroupFilter) {
  const [value, setValue] = useState<GroupFilter>(initial);
  return <GroupTabs value={value} onChange={setValue} />;
}

export const All: Story = { render: () => Interactive('all') };
export const Expense: Story = { render: () => Interactive('expense') };
export const Income: Story = { render: () => Interactive('income') };
export const Flex: Story = { render: () => Interactive('flex') };
export const Investment: Story = { render: () => Interactive('investment') };
