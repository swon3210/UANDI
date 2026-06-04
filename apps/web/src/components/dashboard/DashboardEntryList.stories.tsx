import type { Meta, StoryObj } from '@storybook/react';
import { Target } from 'lucide-react';
import { DashboardEntryList, type DashboardEntry } from './DashboardEntryList';

const meta: Meta<typeof DashboardEntryList> = {
  title: 'Dashboard/DashboardEntryList',
  component: DashboardEntryList,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className="mx-auto w-[360px]">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof DashboardEntryList>;

const budgetEntry: DashboardEntry = {
  id: 'budget',
  label: '예산 설정',
  description: '연간 예산 계획',
  href: '/inner/cashbook/plan/annual',
  Icon: Target,
  testId: 'dashboard-entry-budget',
};

export const Default: Story = {
  render: () => <DashboardEntryList entries={[budgetEntry]} />,
};

export const LongText: Story = {
  render: () => (
    <DashboardEntryList
      entries={[
        {
          ...budgetEntry,
          label: '연간 예산 설정',
          description: '한 해의 수입·지출·재테크 예산을 미리 계획하고 월별로 분배해요',
        },
      ]}
    />
  ),
};
