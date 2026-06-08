import type { Meta, StoryObj } from '@storybook/react';
import { CashflowNegativeBanner } from './CashflowNegativeBanner';

const meta: Meta<typeof CashflowNegativeBanner> = {
  title: 'Cashbook/Cashflow/NegativeBanner',
  component: CashflowNegativeBanner,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[400px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CashflowNegativeBanner>;

const noop = () => {};

export const Default: Story = {
  args: {
    label: '신한카드 결제',
    subLabel: '7월 25일',
    balance: -450000,
    onDismiss: noop,
  },
};

export const WithoutSubLabel: Story = {
  args: {
    label: '다음 결제일',
    balance: -1200000,
    onDismiss: noop,
  },
};
