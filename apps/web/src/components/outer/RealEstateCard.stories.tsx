import type { Meta, StoryObj } from '@storybook/react-vite';
import type { RealEstateHoldingInput } from '@/types';
import { RealEstateCard } from './RealEstateCard';

const holding: RealEstateHoldingInput = {
  aptName: '헬리오시티',
  lawdCd: '11710',
  regionName: '서울특별시 송파구',
  dong: '가락동',
  exclusiveArea: 84.99,
  purchasePrice: 1500000000,
  purchaseDate: '2020-01-15',
  isSingleHome: true,
  manualMarketPrice: null,
};

const meta: Meta<typeof RealEstateCard> = {
  title: 'Outer/RealEstateCard',
  component: RealEstateCard,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[360px]">
        <Story />
      </div>
    ),
  ],
  args: {
    holding,
    marketPrice: 1850000000,
    priceSource: 'trade',
    latestTrade: {
      aptName: '헬리오시티',
      dong: '가락동',
      area: 84.99,
      price: 1850000000,
      date: '2026-10-12',
      floor: 12,
    },
    propertyTax: 3120000,
    capitalGains: { gain: 350000000, holdingYears: 6, isExempt: false, tax: 9800000 },
  },
};
export default meta;
type Story = StoryObj<typeof RealEstateCard>;

/** 고가 1주택 — 12억 초과분 과세 */
export const Profit: Story = {};

/** 12억 이하 1주택 2년 이상 — 비과세 */
export const Exempt: Story = {
  args: {
    holding: { ...holding, purchasePrice: 800000000, exclusiveArea: 59.96 },
    marketPrice: 1100000000,
    capitalGains: { gain: 300000000, holdingYears: 6, isExempt: true, tax: 0 },
    propertyTax: 1450000,
  },
};

export const Loss: Story = {
  args: {
    marketPrice: 1350000000,
    capitalGains: { gain: -150000000, holdingYears: 6, isExempt: false, tax: 0 },
  },
};

/** 실거래가 없어 수동 시세 사용 */
export const ManualPrice: Story = {
  args: {
    holding: { ...holding, manualMarketPrice: 1700000000 },
    marketPrice: 1700000000,
    priceSource: 'manual',
    latestTrade: null,
  },
};

export const NoPrice: Story = {
  args: {
    marketPrice: null,
    priceSource: null,
    latestTrade: null,
    propertyTax: null,
    capitalGains: null,
  },
};

export const Loading: Story = { args: { isLoading: true } };
