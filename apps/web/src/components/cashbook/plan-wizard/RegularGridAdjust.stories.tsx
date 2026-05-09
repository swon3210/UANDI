import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { RegularGridAdjust } from './RegularGridAdjust';
import type { CashbookCategory } from '@/types';

const meta: Meta<typeof RegularGridAdjust> = {
  title: 'Cashbook/PlanWizard/RegularGridAdjust',
  component: RegularGridAdjust,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof RegularGridAdjust>;

const sampleCategory: CashbookCategory = {
  id: 'cat-1',
  coupleId: 'c1',
  group: 'income',
  subGroup: 'regular_income',
  name: '정기급여',
  icon: 'wallet',
  color: '#4CAF86',
  isDefault: true,
  sortOrder: 0,
  createdAt: Timestamp.now(),
};

function Demo({ initial, baseAmount }: { initial: number[]; baseAmount: number }) {
  const [values, setValues] = useState(initial);
  return (
    <RegularGridAdjust
      category={sampleCategory}
      baseAmount={baseAmount}
      monthlyAmounts={values}
      onChange={setValues}
    />
  );
}

export const EvenlyFilled: Story = {
  render: () => <Demo baseAmount={3_500_000} initial={Array(12).fill(3_500_000)} />,
};

export const WithBonus: Story = {
  render: () => {
    const base = 3_500_000;
    const arr = Array(12).fill(base);
    arr[0] = 5_000_000; // 1월 인센티브
    arr[6] = 4_500_000; // 7월 상여
    arr[11] = 4_500_000; // 12월 상여
    return <Demo baseAmount={base} initial={arr} />;
  },
};

export const ZeroBase: Story = {
  render: () => <Demo baseAmount={0} initial={Array(12).fill(0)} />,
};
