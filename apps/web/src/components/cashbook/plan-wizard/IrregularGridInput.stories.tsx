import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { IrregularGridInput } from './IrregularGridInput';
import type { CashbookCategory } from '@/types';

const meta: Meta<typeof IrregularGridInput> = {
  title: 'Cashbook/PlanWizard/IrregularGridInput',
  component: IrregularGridInput,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof IrregularGridInput>;

const sampleCategory: CashbookCategory = {
  id: 'cat-1',
  coupleId: 'c1',
  group: 'expense',
  subGroup: 'fixed_expense',
  name: '명절용돈',
  icon: 'envelope',
  color: '#D8635A',
  isDefault: true,
  sortOrder: 4,
  createdAt: Timestamp.now(),
};

function Demo({
  category = sampleCategory,
  initial,
}: {
  category?: CashbookCategory;
  initial: number[];
}) {
  const [values, setValues] = useState(initial);
  return <IrregularGridInput category={category} monthlyAmounts={values} onChange={setValues} />;
}

export const Empty: Story = {
  render: () => <Demo initial={Array(12).fill(0)} />,
};

export const TwoMonths: Story = {
  render: () => <Demo initial={[500_000, 0, 0, 0, 0, 0, 0, 0, 500_000, 0, 0, 0]} />,
};

export const VariableCommon: Story = {
  render: () => (
    <Demo
      category={{
        ...sampleCategory,
        id: 'cat-2',
        subGroup: 'variable_common',
        name: '식비',
        icon: 'bowl_food',
      }}
      initial={Array(12).fill(600_000)}
    />
  ),
};

export const FlexTravel: Story = {
  render: () => (
    <Demo
      category={{
        ...sampleCategory,
        id: 'cat-3',
        group: 'flex',
        subGroup: 'joint_flex',
        name: '여행',
        icon: 'airplane',
        color: '#F0A05E',
      }}
      initial={[0, 0, 0, 0, 1_500_000, 0, 0, 2_000_000, 0, 0, 0, 0]}
    />
  ),
};
