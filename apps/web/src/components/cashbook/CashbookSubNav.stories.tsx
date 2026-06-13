import type { Meta, StoryObj } from '@storybook/react';
import { CashbookSubNav } from './CashbookSubNav';

const meta: Meta<typeof CashbookSubNav> = {
  title: 'cashbook/CashbookSubNav',
  component: CashbookSubNav,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div className="max-w-md mx-auto">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CashbookSubNav>;

export const Default: Story = {
  name: '내역 활성',
  args: { activePath: '/inner/cashbook/history' },
};

export const WeeklyActive: Story = {
  name: '주간 활성',
  args: { activePath: '/inner/cashbook/history/weekly' },
};

export const MonthlyActive: Story = {
  name: '월간 활성',
  args: { activePath: '/inner/cashbook/history/monthly' },
};
