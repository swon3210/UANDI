import type { Meta, StoryObj } from '@storybook/react';
import { CashbookTabs } from './CashbookTabs';

const meta: Meta<typeof CashbookTabs> = {
  title: 'cashbook/CashbookTabs',
  component: CashbookTabs,
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
type Story = StoryObj<typeof CashbookTabs>;

export const DashboardActive: Story = {
  name: '대시보드 활성 (루트)',
  args: { activePath: '/inner/cashbook' },
};

export const HistoryActive: Story = {
  name: '내역 활성',
  args: { activePath: '/inner/cashbook/history' },
};

export const CashflowActive: Story = {
  name: '현금흐름 활성',
  args: { activePath: '/inner/cashbook/cashflow' },
};

export const ReviewDetail_NoActive: Story = {
  name: '점검 상세 — 활성 탭 없음',
  args: { activePath: '/inner/cashbook/review' },
};

export const PlanActive_DeepPath: Story = {
  name: '목표 활성 (하위 경로도 유지)',
  args: { activePath: '/inner/cashbook/plan/annual/items' },
};
