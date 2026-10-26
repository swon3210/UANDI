import type { Meta, StoryObj } from '@storybook/react-vite';
import type { PortfolioSummary } from '@/utils/stock-portfolio';
import { PortfolioSummaryCard } from './PortfolioSummaryCard';

const summary: PortfolioSummary = {
  totalCostKrw: 11220000,
  totalValueKrw: 12450000,
  totalProfitKrw: 1230000,
  totalProfitRate: 0.1096,
  dayChangeKrw: -32000,
  annualDividendKrw: 210000,
  missingQuoteCount: 0,
};

const meta: Meta<typeof PortfolioSummaryCard> = {
  title: 'Outer/PortfolioSummaryCard',
  component: PortfolioSummaryCard,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[360px]">
        <Story />
      </div>
    ),
  ],
  args: { summary, asOfLabel: '10/26 15:30 시세 기준' },
};
export default meta;
type Story = StoryObj<typeof PortfolioSummaryCard>;

export const Profit: Story = {};

export const Loss: Story = {
  args: {
    summary: {
      ...summary,
      totalValueKrw: 9800000,
      totalProfitKrw: -1420000,
      totalProfitRate: -0.1266,
      dayChangeKrw: 54000,
    },
  },
};

/** 종목코드 없는 종목이 섞인 경우 */
export const MissingQuotes: Story = {
  args: { summary: { ...summary, missingQuoteCount: 2 } },
};

export const QuoteError: Story = {
  args: { quoteError: true, summary: { ...summary, totalProfitKrw: 0, totalProfitRate: 0 } },
};

export const Loading: Story = { args: { isLoading: true } };
