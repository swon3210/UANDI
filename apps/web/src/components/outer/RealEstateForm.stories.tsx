import type { Meta, StoryObj } from '@storybook/react-vite';
import { Sheet } from '@uandi/ui';
import type { AptTrade } from '@/utils/apt-trades';
import { RealEstateForm } from './RealEstateForm';

const TRADES: AptTrade[] = [
  {
    aptName: '헬리오시티',
    dong: '가락동',
    area: 84.99,
    price: 1850000000,
    date: '2026-10-12',
    floor: 12,
  },
  {
    aptName: '헬리오시티',
    dong: '가락동',
    area: 84.99,
    price: 1800000000,
    date: '2026-09-20',
    floor: 5,
  },
  {
    aptName: '헬리오시티',
    dong: '가락동',
    area: 59.96,
    price: 1450000000,
    date: '2026-10-01',
    floor: 8,
  },
  {
    aptName: '헬리오시티',
    dong: '가락동',
    area: 110.8,
    price: 2300000000,
    date: '2026-07-11',
    floor: 30,
  },
];

const meta: Meta<typeof RealEstateForm> = {
  title: 'Outer/RealEstateForm',
  component: RealEstateForm,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <Sheet open>
        <Story />
      </Sheet>
    ),
  ],
  args: {
    defaultPurchaseDate: '2026-10-26',
    onSearchTrades: () => new Promise((resolve) => setTimeout(() => resolve(TRADES), 800)),
    onSubmit: (input) => alert(JSON.stringify(input, null, 2)),
    onClose: () => {},
  },
};
export default meta;
type Story = StoryObj<typeof RealEstateForm>;

/** 송파구 선택 + "헬리오시티" 입력 후 실거래 조회 → 평형 칩 */
export const New: Story = {};

/** 실거래 API 실패 — 전용면적 직접 입력 안내 */
export const SearchFailed: Story = {
  args: {
    onSearchTrades: () => Promise.reject(new Error('실거래가 API가 설정되지 않았어요')),
  },
};

export const Edit: Story = {
  args: {
    initial: {
      aptName: '헬리오시티',
      lawdCd: '11710',
      regionName: '서울특별시 송파구',
      dong: '가락동',
      exclusiveArea: 84.99,
      purchasePrice: 1500000000,
      purchaseDate: '2020-01-15',
      isSingleHome: true,
      manualMarketPrice: null,
    },
    onDelete: () => alert('삭제'),
  },
};
