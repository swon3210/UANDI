import type { Meta, StoryObj } from '@storybook/react-vite';
import { CurrencyCard } from './CurrencyCard';

const meta: Meta<typeof CurrencyCard> = {
  title: 'Investment/CurrencyCard',
  component: CurrencyCard,
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

type Story = StoryObj<typeof CurrencyCard>;

export const UsdBuy: Story = {
  args: {
    currency: 'USD',
    rate: 1380.5,
    prevClose: 1376.2,
    recommendation: 'buy',
    href: '#',
  },
};

export const JpySell: Story = {
  args: {
    currency: 'JPY',
    rate: 9.082,
    prevClose: 9.12,
    recommendation: 'sell',
    href: '#',
  },
};

export const EurHold: Story = {
  args: {
    currency: 'EUR',
    rate: 1480.0,
    prevClose: 1480.0,
    recommendation: 'hold',
    href: '#',
  },
};

export const CnyNoPrevClose: Story = {
  args: {
    currency: 'CNY',
    rate: 190.5,
    prevClose: null,
    recommendation: 'hold',
    href: '#',
  },
};
