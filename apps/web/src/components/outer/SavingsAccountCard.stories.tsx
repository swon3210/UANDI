import type { Meta, StoryObj } from '@storybook/react-vite';
import type { SavingsAccountInput } from '@/types';
import type { SavingsProjection } from '@/utils/savings';
import { SavingsAccountCard } from './SavingsAccountCard';

const installment: SavingsAccountInput = {
  name: '우리 청년적금',
  bank: '우리은행',
  productType: 'installment',
  interestRate: 4.5,
  interestMethod: 'simple',
  startDate: '2026-03-25',
  maturityDate: '2027-03-25',
  depositAmount: 300000,
  depositCycle: 'monthly',
  depositDay: 25,
  taxType: 'normal',
};

const projection: SavingsProjection = {
  totalPayments: 12,
  paidPayments: 7,
  currentPrincipal: 2100000,
  totalPrincipal: 3600000,
  interestBeforeTax: 87750,
  tax: 13513,
  maturityAmount: 3674237,
  daysToMaturity: 150,
  isMatured: false,
};

const meta: Meta<typeof SavingsAccountCard> = {
  title: 'Outer/SavingsAccountCard',
  component: SavingsAccountCard,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[360px]">
        <Story />
      </div>
    ),
  ],
  args: { account: installment, projection },
};
export default meta;
type Story = StoryObj<typeof SavingsAccountCard>;

export const Installment: Story = {};

/** 정기예금 — 진행률 바 없이 1회 예치 */
export const Deposit: Story = {
  args: {
    account: {
      ...installment,
      name: '쏠편한 정기예금',
      bank: '신한은행',
      productType: 'deposit',
      interestRate: 3.2,
      depositAmount: 10000000,
    },
    projection: {
      ...projection,
      totalPayments: 1,
      paidPayments: 1,
      currentPrincipal: 10000000,
      totalPrincipal: 10000000,
      interestBeforeTax: 320000,
      tax: 49280,
      maturityAmount: 10270720,
    },
  },
};

/** 매주 납입하는 26주 적금 */
export const Weekly: Story = {
  args: {
    account: { ...installment, name: '26주 적금', depositCycle: 'weekly', depositDay: 1 },
    projection: { ...projection, totalPayments: 26, paidPayments: 9 },
  },
};

/** 만기가 지난 상품 */
export const Matured: Story = {
  args: {
    projection: {
      ...projection,
      paidPayments: 12,
      currentPrincipal: 3600000,
      daysToMaturity: -3,
      isMatured: true,
    },
  },
};

/** 긴 상품명은 말줄임 */
export const LongName: Story = {
  args: {
    account: {
      ...installment,
      name: '청년도약계좌 특별우대 자유적립식 정기적금 (모바일 전용)',
    },
  },
};
