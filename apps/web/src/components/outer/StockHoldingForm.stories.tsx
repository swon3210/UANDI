import type { Meta, StoryObj } from '@storybook/react-vite';
import { Sheet } from '@uandi/ui';
import { StockHoldingForm } from './StockHoldingForm';

const meta: Meta<typeof StockHoldingForm> = {
  title: 'Outer/StockHoldingForm',
  component: StockHoldingForm,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <Sheet open>
        <Story />
      </Sheet>
    ),
  ],
  args: {
    onSubmit: (input) => alert(JSON.stringify(input, null, 2)),
    onClose: () => {},
  },
};
export default meta;
type Story = StoryObj<typeof StockHoldingForm>;

export const New: Story = {};

export const EditUsStock: Story = {
  args: {
    initial: {
      name: '애플',
      symbol: 'AAPL',
      market: 'US',
      currency: 'USD',
      quantity: 2,
      averagePrice: 180,
      dividendPerShare: 0.25,
      nextDividendDate: '2026-11-14',
    },
    onDelete: () => alert('삭제'),
  },
};
