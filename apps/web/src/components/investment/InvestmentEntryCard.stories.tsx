import type { Meta, StoryObj } from '@storybook/react-vite';
import { InvestmentEntryCard } from './InvestmentEntryCard';

const meta: Meta<typeof InvestmentEntryCard> = {
  title: 'Investment/InvestmentEntryCard',
  component: InvestmentEntryCard,
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

type Story = StoryObj<typeof InvestmentEntryCard>;

export const WithUsdRising: Story = {
  args: { currencyLabel: 'USD', rate: 1380.5, diffPercent: 0.32 },
};

export const WithUsdFalling: Story = {
  args: { currencyLabel: 'USD', rate: 1370.2, diffPercent: -0.45 },
};

export const Loading: Story = {
  args: { isLoading: true },
};
