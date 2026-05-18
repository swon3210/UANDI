import type { Meta, StoryObj } from '@storybook/react-vite';
import { BuyRecommendationBadge } from './BuyRecommendationBadge';

const meta: Meta<typeof BuyRecommendationBadge> = {
  title: 'Investment/BuyRecommendationBadge',
  component: BuyRecommendationBadge,
};
export default meta;

type Story = StoryObj<typeof BuyRecommendationBadge>;

export const Buy: Story = { args: { recommendation: 'buy' } };
export const Sell: Story = { args: { recommendation: 'sell' } };
export const Hold: Story = { args: { recommendation: 'hold' } };

export const AllVariants: Story = {
  render: () => (
    <div className="flex gap-2">
      <BuyRecommendationBadge recommendation="buy" />
      <BuyRecommendationBadge recommendation="sell" />
      <BuyRecommendationBadge recommendation="hold" />
    </div>
  ),
};
