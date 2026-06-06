import type { Meta, StoryObj } from '@storybook/react';
import { SettlementSummaryHeader } from './SettlementSummaryHeader';

const meta: Meta<typeof SettlementSummaryHeader> = {
  title: 'Cashbook/SettlementSummaryHeader',
  component: SettlementSummaryHeader,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof SettlementSummaryHeader>;

export const Default: Story = {
  render: () => (
    <div className="mx-auto max-w-md">
      <SettlementSummaryHeader income={3_200_000} expense={1_840_000} flex={420_000} />
    </div>
  ),
};

// FLEX가 없는 달
export const NoFlex: Story = {
  render: () => (
    <div className="mx-auto max-w-md">
      <SettlementSummaryHeader income={2_800_000} expense={1_500_000} flex={0} />
    </div>
  ),
};

// 모든 값이 0 (빈 달)
export const Empty: Story = {
  render: () => (
    <div className="mx-auto max-w-md">
      <SettlementSummaryHeader income={0} expense={0} flex={0} />
    </div>
  ),
};

// 큰 금액 (억 단위)
export const LargeAmounts: Story = {
  render: () => (
    <div className="mx-auto max-w-md">
      <SettlementSummaryHeader income={120_000_000} expense={85_400_000} flex={12_300_000} />
    </div>
  ),
};
