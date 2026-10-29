import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { TrendCategoryFilter, type TrendCategoryOption } from './TrendCategoryFilter';

function Stateful({
  options,
  initial,
}: {
  options: TrendCategoryOption[];
  initial: string | null;
}) {
  const [value, setValue] = useState<string | null>(initial);
  return <TrendCategoryFilter options={options} value={value} onChange={setValue} />;
}

const THREE: TrendCategoryOption[] = [
  { name: '여행', color: '#5B8DEF' },
  { name: '식비', color: '#F2994A' },
  { name: '교통', color: '#2D9CDB' },
];

const meta: Meta<typeof Stateful> = {
  title: 'Cashbook/TrendCategoryFilter',
  component: Stateful,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[360px] rounded-xl border border-border bg-card p-4">
        <Story />
      </div>
    ),
  ],
  args: { options: THREE, initial: null },
};
export default meta;

type Story = StoryObj<typeof Stateful>;

/** 기본: 묶음 전체 */
export const All: Story = {};

/** 카테고리 하나를 고른 상태 */
export const OneSelected: Story = {
  args: { initial: '식비' },
};

/** 범위 전체를 분석해 카테고리가 많을 때 — 가로 스크롤 */
export const ManyCategories: Story = {
  args: {
    options: [
      ...THREE,
      { name: '소비', color: '#EB5757' },
      { name: '월세', color: '#9B51E0' },
      { name: '보험', color: '#27AE60' },
      { name: '아주아주긴카테고리이름입니다', color: '#9B9B9B' },
    ],
  },
};
