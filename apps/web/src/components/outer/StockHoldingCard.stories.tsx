import type { Meta, StoryObj } from '@storybook/react-vite';
import type { StockHoldingInput } from '@/types';
import type { StockValuation } from '@/utils/stock-portfolio';
import { StockHoldingCard } from './StockHoldingCard';

const samsung: StockHoldingInput = {
  name: '삼성전자',
  symbol: '005930',
  market: 'KR',
  currency: 'KRW',
  quantity: 10,
  averagePrice: 65000,
  dividendPerShare: 361,
  nextDividendDate: '2026-11-15',
};

const valuation: StockValuation = {
  costKrw: 650000,
  valueKrw: 720000,
  profitKrw: 70000,
  profitRate: 0.1077,
  dayChangeKrw: 10000,
  nextDividendKrw: 3610,
  annualDividendKrw: 14440,
  quote: {
    price: 72000,
    prevClose: 71000,
    currency: 'KRW',
    asOf: '2026-10-26T06:30:00.000Z',
    dividendPerShareTtm: 1444,
  },
};

const meta: Meta<typeof StockHoldingCard> = {
  title: 'Outer/StockHoldingCard',
  component: StockHoldingCard,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[360px]">
        <Story />
      </div>
    ),
  ],
  args: { holding: samsung, valuation, dividendDateLabel: '11/15' },
};
export default meta;
type Story = StoryObj<typeof StockHoldingCard>;

export const ProfitWithDividend: Story = {};

/** 미국 주식 손실 + TTM 배당 */
export const UsLoss: Story = {
  args: {
    holding: {
      ...samsung,
      name: '애플',
      symbol: 'AAPL',
      market: 'US',
      currency: 'USD',
      quantity: 2,
      averagePrice: 210,
      dividendPerShare: null,
      nextDividendDate: null,
    },
    valuation: {
      ...valuation,
      costKrw: 588000,
      valueKrw: 560000,
      profitKrw: -28000,
      profitRate: -0.0476,
      nextDividendKrw: null,
      annualDividendKrw: 2800,
      quote: { ...valuation.quote!, price: 200, prevClose: 198, currency: 'USD' },
    },
    dividendDateLabel: null,
  },
};

/** 종목코드가 없어 시세를 못 가져온 경우 */
export const NoSymbol: Story = {
  args: {
    holding: { ...samsung, name: '어느 비상장 종목', symbol: '', dividendPerShare: null },
    valuation: {
      ...valuation,
      valueKrw: null,
      profitKrw: null,
      profitRate: null,
      dayChangeKrw: null,
      nextDividendKrw: null,
      annualDividendKrw: null,
      quote: null,
    },
  },
};
