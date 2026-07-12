import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import type { CashbookEntryType } from '@/types';
import { TypeFilterChips } from './TypeFilterChips';

const meta: Meta<typeof TypeFilterChips> = {
  title: 'Cashbook/TypeFilterChips',
  component: TypeFilterChips,
};

export default meta;
type Story = StoryObj<typeof TypeFilterChips>;

function Interactive({ initial }: { initial: CashbookEntryType[] }) {
  const [value, setValue] = useState<CashbookEntryType[]>(initial);
  const toggle = (t: CashbookEntryType) =>
    setValue((v) => (v.includes(t) ? v.filter((x) => x !== t) : [...v, t]));
  return (
    <div className="max-w-sm space-y-2">
      <TypeFilterChips value={value} onToggle={toggle} />
      <p className="text-xs text-muted-foreground">
        선택: {value.length === 0 ? '전체' : value.join(', ')}
      </p>
    </div>
  );
}

/** 아무것도 선택하지 않은 상태(= 전체). */
export const Empty: Story = {
  render: () => <Interactive initial={[]} />,
};

/** 지출 하나만 선택. */
export const SingleSelected: Story = {
  render: () => <Interactive initial={['expense']} />,
};

/** 지출 + 수입 다중 선택. */
export const MultiSelected: Story = {
  render: () => <Interactive initial={['expense', 'income']} />,
};

/** 셋 다 선택. */
export const AllSelected: Story = {
  render: () => <Interactive initial={['expense', 'income', 'flex']} />,
};
