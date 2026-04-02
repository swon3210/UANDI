import type { Meta, StoryObj } from '@storybook/react';
import { CashbookSubNav } from './CashbookSubNav';

const meta: Meta<typeof CashbookSubNav> = {
  title: 'cashbook/CashbookSubNav',
  component: CashbookSubNav,
  parameters: {
    layout: 'fullscreen',
    nextjs: { appDirectory: true },
  },
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
  parameters: {
    nextjs: { appDirectory: true, navigation: { pathname: '/cashbook/history' } },
  },
};

export const MonthlyActive: Story = {
  parameters: {
    nextjs: { appDirectory: true, navigation: { pathname: '/cashbook/history/monthly' } },
  },
};

export const WeeklyActive: Story = {
  parameters: {
    nextjs: { appDirectory: true, navigation: { pathname: '/cashbook/history/weekly' } },
  },
};
