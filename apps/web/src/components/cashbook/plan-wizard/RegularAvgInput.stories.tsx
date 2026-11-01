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

function Demo({
  category,
  initial,
  hint,
  annualNote,
  caption,
}: {
  category: CashbookCategory;
  initial: number;
  hint?: string;
  annualNote?: string | null;
  caption?: string;
}) {
  const [value, setValue] = useState(initial);
  return (
    <RegularAvgInput
      category={category}
      value={value}
      onChange={setValue}
      hint={hint}
      annualNote={annualNote}
      caption={caption}
    />
  );
}

/** 수입 정기 항목 — 두 사람 합산 안내 */
export const WithIncomeHint: Story = {
  render: () => <Demo category={sampleCategory} initial={0} hint="두 사람 수입을 합쳐 적어요" />,
};

/** 빠른 모드의 변동 항목 — 그리드 단계가 없으니 연간 합계 보조 문구를 바꾼다 */
export const QuickVariable: Story = {
  render: () => (
    <Demo
      category={{
        ...sampleCategory,
        id: 'cat-3',
        group: 'expense',
        subGroup: 'variable_common',
        name: '식비',
        icon: 'bowl_food',
        color: '#D8635A',
      }}
      initial={600_000}
      caption="변동 항목 · 월 평균"
      hint="함께 쓰는 지출의 한 달 평균이에요. 정확하지 않아도 괜찮아요"
      annualNote="나중에 경제 목표에서 달마다 다르게 조정할 수 있어요."
    />
  ),
};

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
