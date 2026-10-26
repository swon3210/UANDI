import type { Meta, StoryObj } from '@storybook/react-vite';
import { Sheet } from '@uandi/ui';
import { StockImportSheet } from './StockImportSheet';

const meta: Meta<typeof StockImportSheet> = {
  title: 'Outer/StockImportSheet',
  component: StockImportSheet,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <Sheet open>
        <Story />
      </Sheet>
    ),
  ],
  args: {
    holdings: [
      {
        name: '삼성전자',
        symbol: '005930',
        market: 'KR',
        currency: 'KRW',
        quantity: 10,
        averagePrice: 65000,
        dividendPerShare: 361,
        nextDividendDate: '2026-11-15',
      },
      {
        name: 'KODEX 미국S&P500',
        symbol: '',
        market: 'KR',
        currency: 'KRW',
        quantity: 120,
        averagePrice: 18250,
        dividendPerShare: null,
        nextDividendDate: null,
      },
      {
        name: '애플',
        symbol: 'AAPL',
        market: 'US',
        currency: 'USD',
        quantity: 2.5,
        averagePrice: 180.32,
        dividendPerShare: null,
        nextDividendDate: null,
      },
    ],
    onSave: (items) => alert(`${items.length}개 저장`),
    onClose: () => {},
  },
};
export default meta;
type Story = StoryObj<typeof StockImportSheet>;

export const Default: Story = {};

export const SingleHolding: Story = {
  args: { holdings: meta.args!.holdings!.slice(0, 1) },
};
