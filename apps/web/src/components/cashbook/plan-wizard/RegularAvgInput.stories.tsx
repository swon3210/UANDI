import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { RegularAvgInput } from './RegularAvgInput';
import type { CashbookCategory } from '@/types';

const meta: Meta<typeof RegularAvgInput> = {
  title: 'Cashbook/PlanWizard/RegularAvgInput',
  component: RegularAvgInput,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof RegularAvgInput>;

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

function Demo({ category, initial }: { category: CashbookCategory; initial: number }) {
  const [value, setValue] = useState(initial);
  return <RegularAvgInput category={category} value={value} onChange={setValue} />;
}

export const Empty: Story = {
  render: () => <Demo category={sampleCategory} initial={0} />,
};

export const Filled: Story = {
  render: () => <Demo category={sampleCategory} initial={3_500_000} />,
};

export const FixedExpense: Story = {
  render: () => (
    <Demo
      category={{
        ...sampleCategory,
        id: 'cat-2',
        group: 'expense',
        subGroup: 'fixed_expense',
        name: '월세',
        icon: 'house',
        color: '#D8635A',
      }}
      initial={800_000}
    />
  ),
};
