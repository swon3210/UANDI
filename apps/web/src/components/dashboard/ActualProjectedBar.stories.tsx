import type { Meta, StoryObj } from '@storybook/react';
import { ActualProjectedBar } from './ActualProjectedBar';

const meta: Meta<typeof ActualProjectedBar> = {
  title: 'Dashboard/ActualProjectedBar',
  component: ActualProjectedBar,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[320px] rounded-xl border border-border bg-card p-4">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof ActualProjectedBar>;

export const Expense: Story = {
  args: { actual: 1_370_000, upcoming: 1_300_000, max: 2_670_000, tone: 'expense' },
};

export const Income: Story = {
  args: { actual: 150_000, upcoming: 3_000_000, max: 3_150_000, tone: 'income' },
};

/** 다른 막대와 같은 축을 쓸 때: max가 더 커서 막대가 다 차지 않는다 */
export const SharedScale: Story = {
  args: { actual: 300_000, upcoming: 800_000, max: 4_000_000, tone: 'expense' },
};

export const ActualOnly: Story = {
  args: { actual: 900_000, upcoming: 0, max: 900_000, tone: 'expense' },
};

export const UpcomingOnly: Story = {
  args: { actual: 0, upcoming: 800_000, max: 800_000, tone: 'expense' },
};

export const Empty: Story = {
  args: { actual: 0, upcoming: 0, max: 0, tone: 'income' },
};
