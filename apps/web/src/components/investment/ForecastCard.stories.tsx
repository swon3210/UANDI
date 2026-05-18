import type { Meta, StoryObj } from '@storybook/react-vite';
import { ForecastCard } from './ForecastCard';

const meta: Meta<typeof ForecastCard> = {
  title: 'Investment/ForecastCard',
  component: ForecastCard,
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

type Story = StoryObj<typeof ForecastCard>;

export const Buy: Story = {
  args: {
    outlook: {
      summary:
        '최근 한 달간 완만한 하락세가 이어졌고 52주 최저가 근처에 머무르고 있어 매수 진입에 우호적인 구간으로 판단됩니다.',
      recommendation: 'buy',
      confidence: 0.72,
    },
    isLoading: false,
    error: null,
    onRefresh: () => {},
  },
};

export const Sell: Story = {
  args: {
    outlook: {
      summary:
        '최근 환율이 52주 최고가에 근접해 단기 과열 신호가 보입니다. 보유 외화가 있다면 일부 분할 매도를 고려할 만한 시점입니다.',
      recommendation: 'sell',
      confidence: 0.65,
    },
    isLoading: false,
    error: null,
    onRefresh: () => {},
  },
};

export const Loading: Story = {
  args: {
    outlook: undefined,
    isLoading: true,
    error: null,
    onRefresh: () => {},
  },
};

export const Error: Story = {
  args: {
    outlook: undefined,
    isLoading: false,
    error: '일일 사용 한도를 초과했습니다',
    onRefresh: () => {},
  },
};
